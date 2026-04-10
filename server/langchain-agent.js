/**
 * LangChain Agent — wraps all 13 NagorMind tools into a LangChain AgentExecutor
 * with ChatGroq LLM, conversation memory, and streaming callbacks.
 *
 * This replaces the manual Groq API loop with LangChain's agentic framework,
 * providing: structured tool calling, automatic retry, conversation buffer memory,
 * and callback-driven streaming for real-time UI updates.
 */
import { ChatGroq } from '@langchain/groq';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TOOLS } from './tools/index.js';
import { setRenderSender } from './tools/render.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts', 'system_prompt.txt'), 'utf-8');

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

// ── Zod schemas for each tool ──────────────────────────────────────────────

const geocodeSchema = z.object({
  place_name: z.string().describe('The place name to geocode, e.g., "Mirpur 10, Dhaka"'),
});

const osmAmenitiesSchema = z.object({
  lat: z.number().describe('Latitude'),
  lon: z.number().describe('Longitude'),
  radius_m: z.number().describe('Search radius in meters'),
  types: z.array(z.string()).describe('Amenity types: hospital, clinic, school, pharmacy'),
});

const osmInfraSchema = z.object({
  lat: z.number().describe('Latitude'),
  lon: z.number().describe('Longitude'),
  radius_m: z.number().describe('Search radius in meters'),
  types: z.array(z.string()).describe('Infrastructure types: drain, road, bridge, waterway, culvert'),
});

const boundarySchema = z.object({
  area_name: z.string().describe('Area name, e.g., "Mirpur", "Dhanmondi", "Gulshan"'),
});

const latLonSchema = z.object({
  lat: z.number().describe('Latitude'),
  lon: z.number().describe('Longitude'),
});

const coverageSchema = z.object({
  lat: z.number().describe('Latitude of area center'),
  lon: z.number().describe('Longitude of area center'),
  radius_m: z.number().describe('Analysis radius in meters'),
  service_type: z.string().describe('Service type: hospital, clinic, school, pharmacy'),
  coverage_radius_m: z.number().optional().describe('Optional custom coverage radius per facility in meters'),
});

const floodSchema = z.object({
  lat: z.number().describe('Latitude'),
  lon: z.number().describe('Longitude'),
  radius_m: z.number().describe('Analysis radius in meters'),
});

const compareSchema = z.object({
  location_a: z.string().describe('First location name'),
  location_b: z.string().describe('Second location name'),
  metrics: z.array(z.string()).describe('Metrics to compare: healthcare, education, air_quality, flood_risk, infrastructure'),
});

const costSchema = z.object({
  intervention_type: z.string().describe('Type: drain, clinic, road_repair, school, bridge'),
  scale: z.string().describe('Scale: small, medium, large'),
  location_context: z.string().optional().describe('Optional area name for context'),
});

const standardsSchema = z.object({
  metric: z.string().describe('Metric: healthcare_access, education_access, drainage, air_quality, road_density, green_space'),
});

const renderSchema = z.object({
  geojson: z.any().describe('GeoJSON FeatureCollection to render'),
  style: z.any().describe('Visualization style object'),
  label: z.string().describe('Layer label for legend'),
  fit_bounds: z.boolean().optional().describe('Auto-zoom to show this data'),
  layer_group: z.string().optional().describe('Group name for toggle control'),
});

const accountabilitySchema = z.object({
  lat: z.number().describe('Latitude'),
  lon: z.number().describe('Longitude'),
  radius_m: z.number().describe('Search radius in meters'),
  project_type: z.string().describe('Project type: drain, road, clinic, school, bridge'),
  reported_budget_bdt: z.number().optional().describe('Optional override budget figure in BDT'),
});

// ── Build LangChain tools from existing tool functions ─────────────────────

function buildLangChainTools() {
  return [
    new DynamicStructuredTool({
      name: 'geocode',
      description: 'Convert a place name in Dhaka to geographic coordinates (latitude, longitude). Use this when the user mentions a location by name.',
      schema: geocodeSchema,
      func: async (input) => JSON.stringify(await TOOLS.geocode(input)),
    }),
    new DynamicStructuredTool({
      name: 'query_osm_amenities',
      description: 'Search for amenities (hospitals, schools, clinics, pharmacies) within a radius of a location using OpenStreetMap data.',
      schema: osmAmenitiesSchema,
      func: async (input) => {
        const result = await TOOLS.query_osm_amenities(input);
        const forLLM = { ...result };
        delete forLLM.geojson;
        return JSON.stringify(forLLM);
      },
    }),
    new DynamicStructuredTool({
      name: 'query_osm_infrastructure',
      description: 'Find physical infrastructure — roads, drains, bridges, waterways, culverts — within a radius using OpenStreetMap data.',
      schema: osmInfraSchema,
      func: async (input) => {
        const result = await TOOLS.query_osm_infrastructure(input);
        const forLLM = { ...result };
        delete forLLM.geojson;
        return JSON.stringify(forLLM);
      },
    }),
    new DynamicStructuredTool({
      name: 'get_boundary',
      description: 'Get the administrative boundary polygon for a named area (thana/district) in Dhaka.',
      schema: boundarySchema,
      func: async (input) => JSON.stringify(await TOOLS.get_boundary(input)),
    }),
    new DynamicStructuredTool({
      name: 'get_air_quality',
      description: 'Get current Air Quality Index (AQI) and pollutant breakdown for a location.',
      schema: latLonSchema,
      func: async (input) => JSON.stringify(await TOOLS.get_air_quality(input)),
    }),
    new DynamicStructuredTool({
      name: 'get_weather',
      description: 'Get current weather conditions and 24-hour forecast for a location. Includes flood-relevant rainfall data.',
      schema: latLonSchema,
      func: async (input) => JSON.stringify(await TOOLS.get_weather(input)),
    }),
    new DynamicStructuredTool({
      name: 'compute_service_coverage',
      description: 'Analyze how well a service type (hospital, clinic, school, pharmacy) covers an area. Returns coverage percentage, gap zones, and recommendations.',
      schema: coverageSchema,
      func: async (input) => {
        const result = await TOOLS.compute_service_coverage(input);
        const forLLM = { ...result };
        delete forLLM.gap_zones_geojson;
        return JSON.stringify(forLLM);
      },
    }),
    new DynamicStructuredTool({
      name: 'estimate_flood_risk',
      description: 'Assess flood vulnerability based on drainage density, proximity to waterways, and recent rainfall.',
      schema: floodSchema,
      func: async (input) => {
        const result = await TOOLS.estimate_flood_risk(input);
        const forLLM = { ...result };
        delete forLLM.vulnerable_geojson;
        return JSON.stringify(forLLM);
      },
    }),
    new DynamicStructuredTool({
      name: 'compare_locations',
      description: 'Side-by-side comparison of two areas across healthcare, education, air quality, flood risk, and infrastructure.',
      schema: compareSchema,
      func: async (input) => JSON.stringify(await TOOLS.compare_locations(input)),
    }),
    new DynamicStructuredTool({
      name: 'estimate_intervention_cost',
      description: 'Estimate cost for a proposed infrastructure intervention using Bangladesh CPTU standard costs.',
      schema: costSchema,
      func: async (input) => JSON.stringify(await TOOLS.estimate_intervention_cost(input)),
    }),
    new DynamicStructuredTool({
      name: 'search_urban_standards',
      description: 'Look up WHO, BNBC, or international urban planning benchmarks for a given metric.',
      schema: standardsSchema,
      func: async (input) => JSON.stringify(await TOOLS.search_urban_standards(input)),
    }),
    new DynamicStructuredTool({
      name: 'render_on_map',
      description: 'Push GeoJSON data to the client map for visualization. Use this to show markers, polygons, circles, or heatmaps on the map.',
      schema: renderSchema,
      func: async (input) => JSON.stringify(await TOOLS.render_on_map(input)),
    }),
    new DynamicStructuredTool({
      name: 'check_infrastructure_delivery',
      description: 'Cross-reference government spending records against physical ground truth (OSM). Computes infrastructure delivery gap score. Use when analyzing infrastructure projects or when users ask about accountability, public spending, or project delivery.',
      schema: accountabilitySchema,
      func: async (input) => {
        const result = await TOOLS.check_infrastructure_delivery(input);
        const forLLM = { ...result };
        delete forLLM.osm_geojson;
        return JSON.stringify(forLLM);
      },
    }),
  ];
}

// ── OSM auto-render helpers (same as before, but triggered from callbacks) ──

const OSM_STYLE_MAP = {
  query_osm_amenities: {
    hospital: { type: 'marker', color: '#ffffff', icon: '🏥' },
    clinic:   { type: 'marker', color: '#a3e635', icon: '🏥' },
    school:   { type: 'marker', color: '#60a5fa', icon: '🏫' },
    pharmacy: { type: 'marker', color: '#f472b6', icon: '💊' },
    default:  { type: 'marker', color: '#ffffff', icon: '📍' },
  },
  query_osm_infrastructure: {
    drain:    { type: 'polyline', color: '#00d4ff', weight: 2, opacity: 0.8 },
    road:     { type: 'polyline', color: '#94a3b8', weight: 1, opacity: 0.6 },
    bridge:   { type: 'marker',  color: '#fb923c', icon: '🌉' },
    waterway: { type: 'polyline', color: '#38bdf8', weight: 2, opacity: 0.7 },
    culvert:  { type: 'marker',  color: '#a78bfa', icon: '🔩' },
    default:  { type: 'marker',  color: '#94a3b8', icon: '🔧' },
  },
};

// Store raw tool results for auto-rendering (keyed by invocation)
const pendingRenders = new Map();

// ── WebSocket Streaming Callback Handler ───────────────────────────────────

class NagorMindCallbackHandler extends BaseCallbackHandler {
  name = 'NagorMindCallbackHandler';

  constructor(send) {
    super();
    this.send = send;
    this.stepCount = 0;
    this.toolsUsed = [];
    this.startTime = Date.now();
  }

  handleLLMStart(_llm, _prompts) {
    this.send({
      type: 'reasoning',
      text: 'LangChain agent is reasoning...',
      step: this.stepCount,
      total_steps: 0,
    });
  }

  handleToolStart(tool, input, _runId, _parentRunId, _tags, _metadata, runName) {
    this.stepCount++;
    // Extract actual tool name from all possible sources
    let toolName = 'unknown';
    if (runName) toolName = runName;
    else if (typeof tool === 'string') toolName = tool;
    else if (tool?.name) toolName = tool.name;
    else if (tool?.lc_kwargs?.name) toolName = tool.lc_kwargs.name;
    else if (tool?.id) toolName = tool.id[tool.id.length - 1];
    this.toolsUsed.push(toolName);
    this._lastToolName = toolName;

    let parsedArgs = {};
    try {
      parsedArgs = typeof input === 'string' ? JSON.parse(input) : input;
    } catch {
      parsedArgs = { raw: input };
    }

    this.send({
      type: 'tool_call',
      tool: toolName,
      args: parsedArgs,
      step: this.stepCount,
      total_steps: 0,
    });
  }

  handleToolEnd(output, _runId, _parentRunId, tags) {
    let parsed = {};
    try {
      // LangGraph may pass a ToolMessage object; extract content
      if (typeof output === 'object' && output?.content) {
        parsed = JSON.parse(output.content);
      } else if (typeof output === 'string') {
        parsed = JSON.parse(output);
      } else {
        parsed = { raw: output };
      }
    } catch {
      parsed = { raw: typeof output === 'string' ? output : JSON.stringify(output) };
    }

    const toolName = this._lastToolName || this.toolsUsed[this.toolsUsed.length - 1] || 'unknown';

    this.send({
      type: 'tool_result',
      tool: toolName,
      result: parsed,
      duration_ms: 0,
      step: this.stepCount,
      total_steps: 0,
    });
  }

  handleToolError(err) {
    this.send({
      type: 'tool_result',
      tool: this.toolsUsed[this.toolsUsed.length - 1] || 'unknown',
      result: { error: err.message },
      duration_ms: 0,
      step: this.stepCount,
      total_steps: 0,
    });
  }

  handleChainEnd(_output) {
    // Chain complete
  }

  handleLLMError(err) {
    console.error('[LangChain LLM Error]', err.message);
  }
}

// ── Auto-render side-effects for map visualization ─────────────────────────

function autoRenderOsmResult(toolName, toolArgs, toolResult, send) {
  if (toolResult?.error || !toolResult?.geojson?.features?.length) return;
  if (toolName !== 'query_osm_amenities' && toolName !== 'query_osm_infrastructure') return;

  const styleMap = OSM_STYLE_MAP[toolName];
  const types = toolArgs?.types || [];
  const primaryType = types[0] || 'default';
  const style = styleMap[primaryType] || styleMap.default;

  const typeLabel = types.join(', ');
  const label = typeLabel
    ? typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)
    : (toolName === 'query_osm_amenities' ? 'Amenities' : 'Infrastructure');

  send({
    type: 'map_render',
    action: 'add_layer',
    layer_id: `auto_${toolName}_${Date.now()}`,
    geojson: toolResult.geojson,
    style,
    label: `${label} (${toolResult.total_count})`,
    fit_bounds: true,
  });
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

// ── Build tools with side-effect wrappers for map rendering ────────────────

function buildToolsWithSideEffects(send) {
  const baseLCTools = buildLangChainTools();

  // Wrap tools that need map rendering side-effects
  const wrappedTools = baseLCTools.map((tool) => {
    if (['query_osm_amenities', 'query_osm_infrastructure', 'check_infrastructure_delivery'].includes(tool.name)) {
      const originalFunc = tool.func;
      const toolName = tool.name;

      return new DynamicStructuredTool({
        name: tool.name,
        description: tool.description,
        schema: tool.schema,
        func: async (input) => {
          // Call original underlying tool to get full result (with geojson)
          let fullResult;
          if (toolName === 'query_osm_amenities') {
            fullResult = await TOOLS.query_osm_amenities(input);
          } else if (toolName === 'query_osm_infrastructure') {
            fullResult = await TOOLS.query_osm_infrastructure(input);
          } else if (toolName === 'check_infrastructure_delivery') {
            fullResult = await TOOLS.check_infrastructure_delivery(input);
          }

          // Side-effect: render on map
          if (toolName === 'query_osm_amenities' || toolName === 'query_osm_infrastructure') {
            autoRenderOsmResult(toolName, input, fullResult, send);
          }

          if (toolName === 'check_infrastructure_delivery') {
            emitAccountabilityFlags(input, fullResult, send);
            if (fullResult?.osm_geojson?.features?.length) {
              send({
                type: 'map_render',
                action: 'add_layer',
                layer_id: `acct_osm_${Date.now()}`,
                geojson: fullResult.osm_geojson,
                style: { type: 'polyline', color: '#00d4ff', weight: 2, opacity: 0.7 },
                label: `OSM ${fullResult.project_type} (${fullResult.osm_evidence_count} found)`,
                fit_bounds: true,
              });
            }
          }

          // Return stripped version for LLM
          const forLLM = { ...fullResult };
          delete forLLM.geojson;
          delete forLLM.osm_geojson;
          delete forLLM.gap_zones_geojson;
          delete forLLM.vulnerable_geojson;
          return JSON.stringify(forLLM);
        },
      });
    }
    return tool;
  });

  return wrappedTools;
}

// ── Create LangChain Agent (LangGraph ReAct Agent) ─────────────────────────

function createLangChainAgent(send, modelName = DEFAULT_MODEL) {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: modelName,
    temperature: 0.4,
    maxTokens: 2048,
  });

  const tools = buildToolsWithSideEffects(send);

  const agent = createReactAgent({
    llm,
    tools,
    stateModifier: SYSTEM_PROMPT,
  });

  return agent;
}

// ── Convert session history to LangChain messages ──────────────────────────

function historyToMessages(history) {
  const messages = [];
  for (const msg of (history || []).slice(-20)) {
    if (!msg || !msg.role) continue;
    const content = typeof msg.content === 'string' ? msg.content : '';
    if (!content) continue;
    if (msg.role === 'user') {
      messages.push(new HumanMessage(content));
    } else if (msg.role === 'assistant' || msg.role === 'model') {
      messages.push(new AIMessage(content));
    }
  }
  return messages;
}

// ── Extract final text from LangGraph agent result ─────────────────────────

function extractFinalText(result) {
  const messages = result?.messages || [];
  // Walk backwards to find the last AI message
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?._getType?.() === 'ai' || msg?.constructor?.name === 'AIMessage' || msg?.role === 'assistant') {
      const content = typeof msg.content === 'string' ? msg.content : '';
      if (content.trim()) return content.trim();
    }
  }
  return 'Analysis complete.';
}

// ── Main entry point: handleQuery (drop-in replacement) ────────────────────

export async function handleQueryLangChain(userText, session, send) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  setRenderSender(send);

  const callbackHandler = new NagorMindCallbackHandler(send);
  const startTime = Date.now();

  send({
    type: 'reasoning',
    text: 'LangChain Agent initializing...',
    step: 0,
    total_steps: 0,
  });

  session.history.push({ role: 'user', content: userText });
  const chatHistory = historyToMessages(session.history.slice(0, -1));

  // Build messages array with history + current query
  const inputMessages = [
    ...chatHistory,
    new HumanMessage(userText),
  ];

  let modelName = DEFAULT_MODEL;
  let result;

  try {
    const agent = createLangChainAgent(send, modelName);
    result = await agent.invoke(
      { messages: inputMessages },
      { callbacks: [callbackHandler] }
    );
  } catch (err) {
    // Fallback to smaller model
    console.error(`[LangChain] Primary model failed: ${err.message}, trying fallback...`);
    send({
      type: 'reasoning',
      text: `Switching to fallback model (${FALLBACK_MODEL})...`,
      step: 0,
      total_steps: 0,
    });

    try {
      modelName = FALLBACK_MODEL;
      const agent = createLangChainAgent(send, modelName);
      result = await agent.invoke(
        { messages: inputMessages },
        { callbacks: [callbackHandler] }
      );
    } catch (err2) {
      console.error(`[LangChain] Fallback model also failed: ${err2.message}`);
      throw err2;
    }
  }

  const finalText = extractFinalText(result);

  // Send final response
  send({ type: 'response', text: finalText, done: false });
  send({
    type: 'response',
    text: '',
    done: true,
    metadata: {
      session_id: session.id,
      model: modelName,
      framework: 'langchain',
      agent_type: 'langgraph_react',
      tools_used: [...new Set(callbackHandler.toolsUsed)],
      total_duration_ms: Date.now() - startTime,
    },
  });

  session.history.push({ role: 'assistant', content: finalText });
}

// ── REST API handler (for curl testing) ────────────────────────────────────

export async function handleChatREST(userText, sessionHistory = []) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const events = [];
  const send = (payload) => events.push(payload);

  setRenderSender(send);

  const callbackHandler = new NagorMindCallbackHandler(send);
  const chatHistory = historyToMessages(sessionHistory);
  const startTime = Date.now();

  const inputMessages = [
    ...chatHistory,
    new HumanMessage(userText),
  ];

  const agent = createLangChainAgent(send, DEFAULT_MODEL);
  const result = await agent.invoke(
    { messages: inputMessages },
    { callbacks: [callbackHandler] }
  );

  const finalText = extractFinalText(result);

  return {
    response: finalText,
    model: DEFAULT_MODEL,
    framework: 'langchain',
    agent_type: 'langgraph_react',
    tools_used: [...new Set(callbackHandler.toolsUsed)],
    total_duration_ms: Date.now() - startTime,
    events: events.filter((e) => e.type === 'tool_call' || e.type === 'tool_result'),
  };
}
