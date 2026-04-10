import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initCache } from './cache.js';
import { handleQuery } from './agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Load data files at startup ───
const dataDir = join(ROOT, 'data');

function loadJSON(filename) {
  return JSON.parse(readFileSync(join(dataDir, filename), 'utf-8'));
}

export const DATA = {
  imedProjects: loadJSON('imed_dhaka_projects.json'),
  egpContracts: loadJSON('egp_dhaka_contracts.json'),
  unitCosts: loadJSON('cptu_unit_costs.json'),
  thanas: loadJSON('dhaka_thanas.geojson'),
  standards: loadJSON('urban_standards.json'),
};

// Merge IMED + e-GP into a single projects list
export const ALL_PROJECTS = [...DATA.imedProjects, ...DATA.egpContracts];

// ─── Express app ───
const app = express();
app.use(express.json());

// CORS for frontend dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve static client files if they exist
app.use(express.static(join(ROOT, 'client')));

// ─── REST Endpoints ───

const startTime = Date.now();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    services: {
      groq: process.env.GROQ_API_KEY ? 'configured' : 'missing_key',
      overpass: 'available',
      waqi: process.env.WAQI_TOKEN ? 'configured' : 'missing_key',
      openweathermap: process.env.OWM_API_KEY ? 'configured' : 'missing_key',
    },
  });
});

app.get('/api/data/thanas', (req, res) => {
  res.json(DATA.thanas);
});

app.get('/api/data/standards', (req, res) => {
  res.json(DATA.standards);
});

app.get('/api/data/projects', (req, res) => {
  let projects = ALL_PROJECTS;
  const { thana, type, year_from, year_to } = req.query;

  if (thana) {
    projects = projects.filter(
      (p) => p.thana.toLowerCase() === thana.toLowerCase()
    );
  }
  if (type) {
    projects = projects.filter((p) => p.type === type);
  }
  if (year_from) {
    projects = projects.filter((p) => p.approved_year >= Number(year_from));
  }
  if (year_to) {
    projects = projects.filter((p) => p.approved_year <= Number(year_to));
  }

  res.json({ total: projects.length, projects });
});

// ─── HTTP Server + WebSocket ───

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Session store for conversation history
const sessions = new Map();

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  let sessionId = null;

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON', code: 'INVALID_INPUT', recoverable: true }));
      return;
    }

    if (msg.type === 'query') {
      sessionId = msg.session_id || `session-${Date.now()}`;

      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { id: sessionId, history: [], createdAt: Date.now() });
      }

      const session = sessions.get(sessionId);

      // Send function to push messages back to client
      const send = (payload) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify(payload));
        }
      };

      try {
        await handleQuery(msg.text, session, send);
      } catch (err) {
        console.error('[Agent] Error:', err);

        const status = err?.status;
        const isLlmIssue = typeof status === 'number';
        const isRetryableLlm = status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;

        send({
          type: 'error',
          message: err.message || 'Internal server error',
          code: isLlmIssue ? 'LLM_ERROR' : 'SERVER_ERROR',
          recoverable: isLlmIssue ? isRetryableLlm : false,
          suggestion: isRetryableLlm
            ? 'The model is temporarily overloaded. Please retry in a few seconds.'
            : undefined,
        });
      }
    } else if (msg.type === 'cancel') {
      // Cancel support — set flag on session
      const s = sessions.get(msg.session_id);
      if (s) s.cancelled = true;
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

// Cleanup old sessions every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.createdAt < cutoff) sessions.delete(id);
  }
}, 30 * 60 * 1000);

// ─── Start ───
const PORT = process.env.PORT || 3000;

// Redis is optional — only connect if REDIS_URL is explicitly set
await initCache(process.env.REDIS_URL || null);

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   NagorMind Backend v2.0                 ║
║   http://localhost:${PORT}                  ║
║   WebSocket: ws://localhost:${PORT}/ws      ║
║                                          ║
║   REST:                                  ║
║     GET /api/health                      ║
║     GET /api/data/thanas                 ║
║     GET /api/data/standards              ║
║     GET /api/data/projects               ║
╚══════════════════════════════════════════╝
  `);
  console.log(`[Data] Loaded ${ALL_PROJECTS.length} projects, ${DATA.thanas.features.length} thanas`);
});
