/**
 * Groq Agent — agentic loop with OpenAI-compatible tool calling
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TOOLS, TOOL_DECLARATIONS } from './tools/index.js';
import { setRenderSender } from './tools/render.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts', 'system_prompt.txt'), 'utf-8');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_TOOL_ROUNDS = 10;
const MAX_LLM_RETRIES = 3;
const DEFAULT_MODEL_CANDIDATES = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

const GROQ_TOOLS = TOOL_DECLARATIONS.map((decl) => ({
  type: 'function',
  function: {
    name: decl.name,
    description: decl.description,
    parameters: decl.parameters,
  },
}));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableLLMError(err) {
  const status = err?.status;
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function extractTextFromParts(parts) {
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => p?.text || '').join('').trim();
}

function normalizeHistory(history) {
  const normalized = [];

  for (const msg of history || []) {
    if (!msg || !msg.role) continue;

    if (msg.role === 'user') {
      const content = typeof msg.content === 'string' ? msg.content : extractTextFromParts(msg.parts);
      if (content) normalized.push({ role: 'user', content });
      continue;
    }

    if (msg.role === 'assistant' || msg.role === 'model') {
      const content = typeof msg.content === 'string' ? msg.content : extractTextFromParts(msg.parts);
      if (content) normalized.push({ role: 'assistant', content });
    }
  }

  return normalized;
}

function parseJsonSafe(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getModelCandidates() {
  const configured = process.env.GROQ_MODEL_CANDIDATES;
  const values = configured
    ? configured.split(',').map((m) => m.trim()).filter(Boolean)
    : DEFAULT_MODEL_CANDIDATES;

  return [...new Set(values)];
}

function buildToolOnlyFallback(toolResponses) {
  const lines = ['I completed data retrieval, but the language model is temporarily overloaded. Here is a direct tool summary:'];

  for (const entry of toolResponses) {
    const toolName = entry?.name;
    const result = entry?.response;
    if (!toolName) continue;

    if (result?.error) {
      lines.push(`- ${toolName}: failed (${result.error})`);
      continue;
    }

    if (typeof result?.total_count === 'number') {
      lines.push(`- ${toolName}: found ${result.total_count} records`);
      continue;
    }

    if (typeof result?.aqi === 'number') {
      lines.push(`- ${toolName}: AQI ${result.aqi} (${result.aqi_label || 'unknown'})`);
      continue;
    }

    if (typeof result?.flood_risk_score === 'number') {
      lines.push(`- ${toolName}: flood risk ${result.flood_risk_score}/100 (${result.risk_label || 'unknown'})`);
      continue;
    }

    if (typeof result?.delivery_gap_percent === 'number') {
      lines.push(`- ${toolName}: delivery gap ${result.delivery_gap_percent}% (${result?.gap_label?.level || 'unknown'})`);
      continue;
    }

    lines.push(`- ${toolName}: completed`);
  }

  lines.push('Please retry in a few seconds for a fully written narrative response.');
  return lines.join('\n');
}

function detectLocationFromText(text) {
  const patterns = [
    /\bin\s+([A-Za-z0-9\s,.-]+)\??$/i,
    /\bnear\s+([A-Za-z0-9\s,.-]+)\??$/i,
    /\bat\s+([A-Za-z0-9\s,.-]+)\??$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return 'Dhaka';
}

function inferHeuristicIntent(userText) {
  const t = userText.toLowerCase();

  if (t.includes('air quality') || t.includes('aqi') || t.includes('pollution')) {
    return { intent: 'air_quality' };
  }

  if (t.includes('weather') || t.includes('temperature') || t.includes('rain')) {
    return { intent: 'weather' };
  }

  if (t.includes('flood') || t.includes('waterlogging') || t.includes('drainage')) {
    return { intent: 'flood_risk' };
  }

  const amenityTypes = [];
  if (t.includes('hospital')) amenityTypes.push('hospital');
  if (t.includes('clinic')) amenityTypes.push('clinic');
  if (t.includes('school')) amenityTypes.push('school');
  if (t.includes('pharmacy')) amenityTypes.push('pharmacy');

  if (amenityTypes.length > 0) {
    return { intent: 'amenities', amenityTypes: [...new Set(amenityTypes)] };
  }

  const infraTypes = [];
  if (t.includes('road')) infraTypes.push('road');
  if (t.includes('bridge')) infraTypes.push('bridge');
  if (t.includes('drain')) infraTypes.push('drain');
  if (t.includes('waterway') || t.includes('canal') || t.includes('river')) infraTypes.push('waterway');
  if (t.includes('culvert')) infraTypes.push('culvert');

  if (infraTypes.length > 0) {
    return { intent: 'infrastructure', infraTypes: [...new Set(infraTypes)] };
  }

  return { intent: 'generic' };
}

function emitAccountabilityFlags(toolArgs, toolResult, send) {
  if (!toolResult?.gap_label) return;

  const lat = Number(toolArgs?.lat) || 0;
  const lon = Number(toolArgs?.lon) || 0;

  send({
    type: 'accountability_flags',
    flags: (toolResult.projects || []).map((p, i) => ({
      id: `flag-${Date.now()}-${i}`,
      lat: lat + (i * 0.002),
      lon: lon + (i * 0.001),
      project_name: p.project_name,
      budget_bdt: p.budget_bdt,
      expected_count: toolResult.expected_count_from_budget,
      osm_count: toolResult.osm_evidence_count,
      gap_percent: toolResult.delivery_gap_percent,
      gap_label: toolResult.gap_label.level,
      gap_color: toolResult.gap_label.color,
      gap_icon: toolResult.gap_label.icon,
      agency: p.implementing_agency,
      year: p.approved_year,
      source_url: p.source_url,
      disclaimer: toolResult.disclaimer,
    })),
  });
}

async function createGroqCompletion({ apiKey, model, messages }) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      tools: GROQ_TOOLS,
      tool_choice: 'auto',
      temperature: 0.4,
      max_tokens: 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Groq API error (${response.status}): ${text.slice(0, 500)}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

async function createGroqCompletionWithRetry({ apiKey, model, messages, send }) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_LLM_RETRIES; attempt++) {
    try {
      return await createGroqCompletion({ apiKey, model, messages });
    } catch (err) {
      lastError = err;

      if (!isRetryableLLMError(err) || attempt === MAX_LLM_RETRIES) {
        throw err;
      }

      const delayMs = Math.min(5000, 800 * (2 ** (attempt - 1)));
      send({
        type: 'reasoning',
        text: `Model is busy right now. Retrying in ${Math.round(delayMs / 1000)}s... (${attempt}/${MAX_LLM_RETRIES})`,
        step: 0,
        total_steps: 0,
      });
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function startWithModelFallback({ apiKey, messages, send }) {
  const candidates = getModelCandidates();
  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const modelName = candidates[i];
    try {
      const completion = await createGroqCompletionWithRetry({
        apiKey,
        model: modelName,
        messages,
        send,
      });
      return { modelName, completion };
    } catch (err) {
      lastError = err;

      if (err?.status === 401 || err?.status === 403) {
        throw err;
      }

      const hasNext = i < candidates.length - 1;
      if (!hasNext) {
        throw err;
      }

      send({
        type: 'reasoning',
        text: `Switching model due to temporary issue on ${modelName}. Trying ${candidates[i + 1]}...`,
        step: 0,
        total_steps: 0,
      });
    }
  }

  throw lastError;
}

async function runHeuristicFallback(userText, session, send, startTime) {
  const location = detectLocationFromText(userText);
  const plan = inferHeuristicIntent(userText);

  send({
    type: 'reasoning',
    text: 'Model is temporarily unavailable. Using direct tool mode for a quick answer...',
    step: 0,
    total_steps: 0,
  });

  const geocodeArgs = { place_name: location };
  send({ type: 'tool_call', tool: 'geocode', args: geocodeArgs, step: 1, total_steps: 2 });

  let geo;
  const geocodeStart = Date.now();
  try {
    geo = await TOOLS.geocode(geocodeArgs);
  } catch (err) {
    geo = { error: err.message };
  }

  send({
    type: 'tool_result',
    tool: 'geocode',
    result: geo,
    duration_ms: Date.now() - geocodeStart,
    step: 1,
    total_steps: 2,
  });

  if (!geo?.lat || !geo?.lon) {
    const text = `I could not locate "${location}" from geocoding in fallback mode. Please retry with a more specific place name.`;
    send({ type: 'response', text, done: false });
    send({
      type: 'response',
      text: '',
      done: true,
      metadata: {
        session_id: session.id,
        model: 'heuristic-fallback',
        tools_used: ['geocode'],
        total_duration_ms: Date.now() - startTime,
        note: 'Returned fallback response due temporary model overload',
      },
    });
    session.history.push({ role: 'assistant', content: text });
    return;
  }

  const toolArgsByIntent = {
    amenities: { lat: geo.lat, lon: geo.lon, radius_m: 2000, types: plan.amenityTypes || ['hospital', 'clinic'] },
    air_quality: { lat: geo.lat, lon: geo.lon },
    weather: { lat: geo.lat, lon: geo.lon },
    flood_risk: { lat: geo.lat, lon: geo.lon, radius_m: 2000 },
    infrastructure: { lat: geo.lat, lon: geo.lon, radius_m: 2000, types: plan.infraTypes || ['road', 'drain'] },
  };

  const toolNameByIntent = {
    amenities: 'query_osm_amenities',
    air_quality: 'get_air_quality',
    weather: 'get_weather',
    flood_risk: 'estimate_flood_risk',
    infrastructure: 'query_osm_infrastructure',
  };

  const toolName = toolNameByIntent[plan.intent];
  if (!toolName) {
    const text = `I geocoded ${location} (${geo.lat}, ${geo.lon}), but this query needs the full language model for deeper reasoning. Please retry shortly.`;
    send({ type: 'response', text, done: false });
    send({
      type: 'response',
      text: '',
      done: true,
      metadata: {
        session_id: session.id,
        model: 'heuristic-fallback',
        tools_used: ['geocode'],
        total_duration_ms: Date.now() - startTime,
        note: 'Returned fallback response due temporary model overload',
      },
    });
    session.history.push({ role: 'assistant', content: text });
    return;
  }

  const toolArgs = toolArgsByIntent[plan.intent];
  send({ type: 'tool_call', tool: toolName, args: toolArgs, step: 2, total_steps: 2 });

  let result;
  const toolStart = Date.now();
  try {
    result = await TOOLS[toolName](toolArgs);
  } catch (err) {
    result = { error: err.message };
  }

  send({
    type: 'tool_result',
    tool: toolName,
    result,
    duration_ms: Date.now() - toolStart,
    step: 2,
    total_steps: 2,
  });

  if (toolName === 'check_infrastructure_delivery') {
    emitAccountabilityFlags(toolArgs, result, send);
  }

  let text;
  if (result?.error) {
    text = `Fallback mode completed geocoding for ${location}, but ${toolName} failed: ${result.error}. Please retry shortly.`;
  } else if (toolName === 'query_osm_amenities') {
    text = `Fallback summary for ${location}: found ${result.total_count} amenities within 2km. Breakdown: ${JSON.stringify(result.by_type || {})}.`;
  } else if (toolName === 'get_air_quality') {
    text = `Fallback summary for ${location}: AQI is ${result.aqi} (${result.aqi_label}). Dominant pollutant: ${result.dominant_pollutant || 'unknown'}.`;
  } else if (toolName === 'get_weather') {
    text = `Fallback summary for ${location}: ${result.current?.description || 'weather available'}, ${result.current?.temp_c ?? 'n/a'}°C, 24h rain forecast ${result.forecast_24h?.total_rain_mm ?? 'n/a'} mm.`;
  } else if (toolName === 'estimate_flood_risk') {
    text = `Fallback summary for ${location}: flood risk score ${result.flood_risk_score}/100 (${result.risk_label}).`;
  } else if (toolName === 'query_osm_infrastructure') {
    text = `Fallback summary for ${location}: found ${result.total_count} infrastructure features. Breakdown: ${JSON.stringify(result.by_type || {})}.`;
  } else {
    text = `Fallback summary: ${toolName} completed for ${location}.`;
  }

  send({ type: 'response', text, done: false });
  send({
    type: 'response',
    text: '',
    done: true,
    metadata: {
      session_id: session.id,
      model: 'heuristic-fallback',
      tools_used: ['geocode', toolName],
      total_duration_ms: Date.now() - startTime,
      note: 'Returned fallback response due temporary model overload',
    },
  });

  session.history.push({ role: 'assistant', content: text });
}

export async function handleQuery(userText, session, send) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  setRenderSender(send);

  const history = normalizeHistory(session.history).slice(-20);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userText },
  ];

  session.history.push({ role: 'user', content: userText });

  send({
    type: 'reasoning',
    text: 'Analyzing your query...',
    step: 0,
    total_steps: 0,
  });

  const startTime = Date.now();

  let activeModel;
  let completion;

  try {
    const started = await startWithModelFallback({ apiKey, messages, send });
    activeModel = started.modelName;
    completion = started.completion;
  } catch (err) {
    if (!isRetryableLLMError(err)) {
      throw err;
    }

    await runHeuristicFallback(userText, session, send, startTime);
    return;
  }

  let stepCount = 0;
  let totalSteps = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (session.cancelled) {
      session.cancelled = false;
      send({ type: 'response', text: 'Query cancelled.', done: true, metadata: {} });
      return;
    }

    const assistantMessage = completion?.choices?.[0]?.message;
    if (!assistantMessage) break;

    const assistantText = typeof assistantMessage.content === 'string'
      ? assistantMessage.content.trim()
      : '';
    const toolCalls = Array.isArray(assistantMessage.tool_calls)
      ? assistantMessage.tool_calls
      : [];

    if (assistantText && toolCalls.length > 0) {
      send({
        type: 'reasoning',
        text: assistantText,
        step: stepCount,
        total_steps: totalSteps || toolCalls.length + 1,
      });
    }

    if (toolCalls.length === 0) {
      const finalText = assistantText || 'Analysis complete.';

      send({ type: 'response', text: finalText, done: false });
      send({
        type: 'response',
        text: '',
        done: true,
        metadata: {
          session_id: session.id,
          model: activeModel,
          tools_used: [...new Set(session._toolsUsed || [])],
          total_duration_ms: Date.now() - startTime,
          rounds: round,
        },
      });

      session.history.push({ role: 'assistant', content: finalText });
      delete session._toolsUsed;
      return;
    }

    messages.push({
      role: 'assistant',
      content: assistantMessage.content || '',
      tool_calls: toolCalls,
    });

    totalSteps = toolCalls.length + 1;
    const toolResponses = [];

    for (const tc of toolCalls) {
      const toolName = tc?.function?.name || 'unknown_tool';
      const toolArgs = parseJsonSafe(tc?.function?.arguments);
      stepCount++;

      if (!session._toolsUsed) session._toolsUsed = [];
      session._toolsUsed.push(toolName);

      send({
        type: 'tool_call',
        tool: toolName,
        args: toolArgs,
        step: stepCount,
        total_steps: totalSteps,
      });

      let toolResult;
      const toolStart = Date.now();

      try {
        const fn = TOOLS[toolName];
        if (!fn) {
          toolResult = { error: `Unknown tool: ${toolName}` };
        } else {
          toolResult = await fn(toolArgs);
        }
      } catch (err) {
        console.error(`[Tool] ${toolName} error:`, err.message);
        toolResult = { error: err.message };
      }

      send({
        type: 'tool_result',
        tool: toolName,
        result: toolResult,
        duration_ms: Date.now() - toolStart,
        step: stepCount,
        total_steps: totalSteps,
      });

      if (toolName === 'check_infrastructure_delivery') {
        emitAccountabilityFlags(toolArgs, toolResult, send);
      }

      toolResponses.push({ name: toolName, response: toolResult });
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        name: toolName,
        content: JSON.stringify(toolResult),
      });
    }

    try {
      completion = await createGroqCompletionWithRetry({
        apiKey,
        model: activeModel,
        messages,
        send,
      });
    } catch (err) {
      if (!isRetryableLLMError(err)) {
        throw err;
      }

      const fallbackText = buildToolOnlyFallback(toolResponses);
      send({ type: 'response', text: fallbackText, done: false });
      send({
        type: 'response',
        text: '',
        done: true,
        metadata: {
          session_id: session.id,
          model: activeModel,
          tools_used: [...new Set(session._toolsUsed || [])],
          total_duration_ms: Date.now() - startTime,
          rounds: round,
          note: 'Returned tool-only summary due temporary model overload',
        },
      });

      session.history.push({ role: 'assistant', content: fallbackText });
      delete session._toolsUsed;
      return;
    }
  }

  const fallbackText = 'Analysis complete.';
  send({ type: 'response', text: fallbackText, done: false });
  send({
    type: 'response',
    text: '',
    done: true,
    metadata: {
      session_id: session.id,
      model: activeModel,
      tools_used: [...new Set(session._toolsUsed || [])],
      total_duration_ms: Date.now() - startTime,
      rounds: MAX_TOOL_ROUNDS,
      note: 'Reached maximum tool rounds',
    },
  });

  session.history.push({ role: 'assistant', content: fallbackText });
  delete session._toolsUsed;
}
