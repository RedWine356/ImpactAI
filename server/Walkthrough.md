# NagorMind Backend — Setup & Testing Walkthrough

> Complete guide to set up, run, and test the NagorMind API backend.

---

## 1. Prerequisites

| Tool | Required Version | Check Command |
|------|-----------------|---------------|
| Node.js | >= 18.x | `node --version` |
| npm | >= 9.x | `npm --version` |
| Docker | >= 20.x | `docker --version` |
| Docker Compose | >= 2.x | `docker compose version` |

---

## 2. API Keys Setup

You need **3 free API keys**. Get them before starting:

### 2.1 Groq API Key (Required)
1. Go to https://console.groq.com/keys
2. Click **Create API Key**
3. Copy the key (format: `gsk_...`)

### 2.2 WAQI Token (Required for air quality)
1. Go to https://aqicn.org/data-platform/token/
2. Fill in the form and submit
3. Check email for the token

### 2.3 OpenWeatherMap Key (Required for weather/flood)
1. Go to https://openweathermap.org/api → Sign Up
2. Go to https://home.openweathermap.org/api_keys
3. Copy the key
4. **Note**: New keys take up to 2 hours to activate

---

## 3. Quick Start

```bash
# 1. Navigate to project root
cd /path/to/ImpactAI

# 2. Create .env file from template
cp .env.example .env

# 3. Edit .env and add your API keys
nano .env   # or use any editor

# 4. Start Redis via Docker
docker compose up -d

# 5. Install dependencies
npm install

# 6. Start the server
npm run dev
```

You should see:
```
╔══════════════════════════════════════════╗
║   NagorMind Backend v2.0                 ║
║   http://localhost:3000                  ║
║   WebSocket: ws://localhost:3000/ws      ║
╚══════════════════════════════════════════╝
[Data] Loaded 32 projects, 20 thanas
```

---

## 4. Testing REST Endpoints

### 4.1 Health Check
```bash
curl http://localhost:3000/api/health | jq
```
**Expected**: JSON with `status: "ok"` and service statuses.

### 4.2 Get Thana Boundaries
```bash
curl http://localhost:3000/api/data/thanas | jq '.features | length'
```
**Expected**: `20` (number of thana boundaries loaded)

### 4.3 Get Urban Standards
```bash
curl http://localhost:3000/api/data/standards | jq 'keys'
```
**Expected**: `["air_quality", "drainage", "education_access", "green_space", ...]`

### 4.4 Get Projects (with filters)
```bash
# All projects
curl "http://localhost:3000/api/data/projects" | jq '.total'

# Filter by thana
curl "http://localhost:3000/api/data/projects?thana=Mirpur" | jq '.total'

# Filter by type and year
curl "http://localhost:3000/api/data/projects?type=drain&year_from=2022" | jq '.projects[].project_name'
```

---

## 5. Testing WebSocket (Chat + Agent)

### 5.1 Using the UI (Recommended)

If you have the frontend running, open it in your browser and use the chat panel directly. The UI connects to `ws://localhost:3000/ws` automatically.

### 5.2 Using wscat (CLI testing)

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3000/ws
```

Then send JSON messages:

#### Test 1: Basic Query
```json
{"type": "query", "text": "What hospitals are near Mirpur 10?"}
```
**Expected WebSocket messages back**:
1. `reasoning` — Agent thinking
2. `tool_call` — `geocode("Mirpur 10, Dhaka")`
3. `tool_result` — Coordinates returned
4. `tool_call` — `query_osm_amenities(...)` with hospital/clinic types
5. `tool_result` — List of hospitals found
6. `tool_call` — `render_on_map(...)` to show on map
7. `tool_result` — Layer rendered
8. `response` — Final answer with hospital count and analysis
9. `response` (done: true) — Metadata with tools used and duration

#### Test 2: Flood Risk Analysis
```json
{"type": "query", "text": "Analyze flood infrastructure in Mirpur 10"}
```
**Expected**: Agent calls `geocode`, `query_osm_infrastructure`, `estimate_flood_risk`, and `check_infrastructure_delivery`. Watch for accountability flags.

#### Test 3: Accountability Check
```json
{"type": "query", "text": "Show me infrastructure delivery gaps for drainage projects in Mirpur"}
```
**Expected**: Agent calls `check_infrastructure_delivery`. You should see:
- `tool_call` with `check_infrastructure_delivery`
- `tool_result` with gap percentage and label
- `accountability_flags` message with flag pins for the map
- `response` with gap analysis, source citations, and mandatory disclaimer

#### Test 4: Compare Areas
```json
{"type": "query", "text": "Compare healthcare access between Mirpur and Dhanmondi"}
```
**Expected**: Agent geocodes both locations, queries amenities for each, and returns a comparison.

#### Test 5: Air Quality
```json
{"type": "query", "text": "What's the air quality in Gulshan right now?"}
```
**Expected**: Agent calls `geocode` then `get_air_quality`. Returns AQI, pollutant breakdown, WHO comparison.

#### Test 6: Cost Estimation
```json
{"type": "query", "text": "How much would it cost to build new drainage in Hazaribagh?"}
```
**Expected**: Agent calls `estimate_intervention_cost` with type=drain.

---

## 6. WebSocket Message Types Reference

### Messages You Send (Client → Server)

| Type | Purpose | Example |
|------|---------|---------|
| `query` | Send a question | `{"type": "query", "text": "...", "session_id": "optional"}` |
| `cancel` | Cancel in-progress query | `{"type": "cancel", "session_id": "..."}` |

### Messages You Receive (Server → Client)

| Type | Purpose | Key Fields |
|------|---------|------------|
| `reasoning` | Agent thinking | `text`, `step`, `total_steps` |
| `tool_call` | Tool being called | `tool`, `args`, `step` |
| `tool_result` | Tool returned data | `tool`, `result`, `duration_ms` |
| `response` | Final/partial answer | `text`, `done`, `metadata` |
| `map_render` | Map layer to display | `geojson`, `style`, `label` |
| `accountability_flags` | Flag pins for map | `flags[]` with lat, lon, gap data |
| `error` | Error occurred | `message`, `code`, `recoverable` |

---

## 7. Connecting Your Frontend UI

### 7.1 WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected to NagorMind');
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  switch (msg.type) {
    case 'reasoning':
      // Show thinking indicator with msg.text
      // Update progress: msg.step / msg.total_steps
      break;
      
    case 'tool_call':
      // Show tool badge: "🛠️ {msg.tool}({JSON.stringify(msg.args)})"
      break;
      
    case 'tool_result':
      // Show result: "→ {summary of msg.result}"
      // Duration: msg.duration_ms
      break;
      
    case 'response':
      if (!msg.done) {
        // Append msg.text to chat bubble
      } else {
        // Query complete — show metadata
        // msg.metadata.tools_used, msg.metadata.total_duration_ms
      }
      break;
      
    case 'map_render':
      // Add GeoJSON layer to Leaflet map
      // msg.geojson, msg.style, msg.label
      // L.geoJSON(msg.geojson, { style: ... }).addTo(map);
      break;
      
    case 'accountability_flags':
      // Add flag markers to map
      // msg.flags.forEach(flag => { add marker with popup })
      break;
      
    case 'error':
      // Show error: msg.message
      // If msg.recoverable, allow retry
      break;
  }
};

// Send a query
function askQuestion(text) {
  ws.send(JSON.stringify({
    type: 'query',
    text: text,
    session_id: 'my-session-1'  // optional, for conversation continuity
  }));
}
```

### 7.2 REST Endpoints for Initial Data

```javascript
// Load thana boundaries for the map
const thanas = await fetch('/api/data/thanas').then(r => r.json());
L.geoJSON(thanas, {
  style: { color: '#00d4ff', weight: 1, opacity: 0.3, fillOpacity: 0.05 }
}).addTo(map);

// Load urban standards for reference
const standards = await fetch('/api/data/standards').then(r => r.json());

// Load projects for a specific area
const projects = await fetch('/api/data/projects?thana=Mirpur').then(r => r.json());
```

### 7.3 Rendering Accountability Flags on Leaflet

```javascript
function renderFlags(flags) {
  flags.forEach(flag => {
    const color = flag.gap_color;
    const marker = L.circleMarker([flag.lat, flag.lon], {
      radius: 10,
      color: color,
      fillColor: color,
      fillOpacity: 0.8,
    }).addTo(map);
    
    marker.bindPopup(`
      <div style="font-family: Inter; max-width: 300px;">
        <h3>${flag.gap_icon} ${flag.project_name}</h3>
        <p><b>Budget:</b> BDT ${(flag.budget_bdt / 10000000).toFixed(1)} Crore (${flag.year})</p>
        <p><b>Agency:</b> ${flag.agency}</p>
        <p><b>Expected:</b> ~${flag.expected_count} | <b>Found:</b> ${flag.osm_count}</p>
        <div style="background: ${color}20; padding: 8px; border-radius: 6px; border-left: 3px solid ${color};">
          <b>Gap: ${flag.gap_percent}% — ${flag.gap_label}</b>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
          ${flag.disclaimer}
        </p>
        <a href="${flag.source_url}" target="_blank" style="color: #00d4ff;">View Source ↗</a>
      </div>
    `);
  });
}
```

---

## 8. Demo Queries for Testing

Copy-paste these into the chat to test all major features:

| # | Query | Tests |
|---|-------|-------|
| 1 | "What hospitals are within 2km of Mirpur 10?" | geocode, query_osm_amenities, render_on_map |
| 2 | "Analyze flood infrastructure in Mirpur 10" | geocode, query_osm_infrastructure, estimate_flood_risk, check_infrastructure_delivery |
| 3 | "Show me infrastructure delivery gaps for drainage in Mirpur" | geocode, check_infrastructure_delivery, accountability_flags |
| 4 | "Compare healthcare access between Gulshan and Hazaribagh" | compare_locations (multi-tool) |
| 5 | "What's the air quality like in Dhanmondi?" | geocode, get_air_quality |
| 6 | "How much would it cost to add 1km of drainage in Mohammadpur?" | estimate_intervention_cost |
| 7 | "Show me WHO standards for healthcare access" | search_urban_standards |
| 8 | "Analyze school coverage gaps in Uttara" | geocode, compute_service_coverage |
| 9 | "What's the weather in Dhaka? Is there flood risk?" | get_weather |
| 10 | "Run accountability check for all road projects in Dhanmondi 2020-2024" | geocode, check_infrastructure_delivery for roads |

---

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| `GROQ_API_KEY is not set` | Check your `.env` file has the key without quotes |
| `Redis unavailable` | Run `docker compose up -d`. Server works without Redis (uses in-memory cache) |
| `Overpass API timeout` | Reduce radius in your query. Overpass has fair-use limits |
| `WAQI returns error` | Check your WAQI_TOKEN. Free tier: 1000 calls/day |
| `OWM returns 401` | New OWM keys take up to 2 hours to activate |
| `WebSocket disconnects` | Check server logs. Ensure CORS allows your frontend origin |
| `No projects found` | The pre-loaded data covers specific Dhaka thanas. Try: Mirpur, Dhanmondi, Gulshan, Uttara, Hazaribagh |
| `npm install fails` | Ensure Node.js >= 18. Try `rm -rf node_modules && npm install` |

---

## 10. Project Structure

```
ImpactAI/
├── docker-compose.yml          # Redis container
├── package.json                # Dependencies
├── .env.example                # API key template
├── .env                        # Your actual keys (git-ignored)
├── server/
│   ├── index.js                # Express + WebSocket server
│   ├── agent.js                # Groq agentic loop
│   ├── cache.js                # Redis + in-memory cache
│   ├── tools/
│   │   ├── index.js            # Tool registry + function declarations
│   │   ├── spatial.js          # Tools 1-4: geocode, OSM queries, boundaries
│   │   ├── environment.js      # Tools 5-6: air quality, weather
│   │   ├── analysis.js         # Tools 7-11: coverage, flood, compare, cost, standards
│   │   ├── render.js           # Tool 12: map visualization via WebSocket
│   │   └── accountability.js   # Tool 13: infrastructure delivery gap checker
│   ├── prompts/
│   │   └── system_prompt.txt   # System prompt
│   └── Walkthrough.md          # This file
└── data/
    ├── imed_dhaka_projects.json    # 20 IMED government projects
    ├── egp_dhaka_contracts.json    # 12 e-GP procurement contracts
    ├── cptu_unit_costs.json        # 10 standard unit costs
    ├── dhaka_thanas.geojson        # 20 thana boundary polygons
    └── urban_standards.json        # WHO/BNBC/UN-Habitat benchmarks
```

---

## 11. Stopping the Server

```bash
# Stop the Node.js server
# Press Ctrl+C in the terminal

# Stop Redis
docker compose down

# Stop Redis and remove data
docker compose down -v
```

---

*NagorMind Backend v2.0 — AI Urban Planning Advisor for Dhaka*
