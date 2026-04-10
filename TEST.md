# NagorMind — Test & Demo Guide

> Aligned with `NagorMind_Implementation_Plan.md`  
> Stack: Groq (llama-3.3-70b-versatile) · Express.js · React/Vite · Leaflet.js · Overpass API

---

## 1. Prerequisites

- Node.js ≥ 18
- pnpm — `npm install -g pnpm` if not installed
- A Groq API key from https://console.groq.com/keys

---

## 2. Environment Setup

Edit `.env` in the project root (`ImpactAI/`):

```env
GROQ_API_KEY=gsk_your_key_here
WAQI_TOKEN=your_waqi_token          # from waqi.info/api — optional but needed for air quality
OWM_API_KEY=your_owm_key            # from openweathermap.org — optional but needed for weather/flood
GROQ_MODEL_CANDIDATES=llama-3.3-70b-versatile,llama-3.1-8b-instant
PORT=3000
NODE_ENV=development
```

---

## 3. Install Dependencies

```bash
# From project root
npm install

# From UI folder
cd ui && pnpm install && cd ..
```

---

## 4. Start the Services

Open **two terminals**:

**Terminal 1 — Backend** (from `ImpactAI/`):
```bash
npm run dev
```

Expected startup output:
```
[Cache] No REDIS_URL — using in-memory cache
╔══════════════════════════════════════════╗
║   NagorMind Backend v2.0                 ║
║   http://localhost:3000                  ║
║   WebSocket: ws://localhost:3000/ws      ║
╚══════════════════════════════════════════╝
[Data] Loaded 32 projects, 20 thanas
```

**Terminal 2 — Frontend** (from `ImpactAI/ui/`):
```bash
pnpm dev
```

Expected output:
```
  VITE v6.x  ready in Xms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## 5. (Optional) Pre-Cache Demo Queries

Run this once before the demo to ensure all Overpass/Nominatim/AQI queries are cached for fast, reliable responses during the presentation:

```bash
# From project root
node server/warmup.js
```

Expected output:
```
🚀 NagorMind Cache Warmup

📍 Mirpur 10, Dhaka
  Caching geocode... OK (312ms)
  Caching amenities (hospital, clinic)... OK (2800ms)
  Caching infrastructure (drain)... OK (3100ms)
  ...

✅ Warmup complete — demo queries are cached.
```

If an endpoint times out, re-run. The lz4 Overpass mirror is the fastest; the script tries 3 endpoints.

---

## 6. REST API Health Checks

Verify the backend is running with these curl tests:

```bash
# Health
curl http://localhost:3000/api/health
# → {"status":"ok","version":"2.0.0",...}

# Thana boundaries (should return 20 thanas)
curl http://localhost:3000/api/data/thanas | python3 -c "import sys,json; d=json.load(sys.stdin); print('Thanas:', len(d['features']))"
# → Thanas: 20

# Public projects (should return 32 total)
curl "http://localhost:3000/api/data/projects" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Total:', d['total'])"
# → Total: 32

# Filter by thana + type
curl "http://localhost:3000/api/data/projects?thana=Mirpur&type=drain"
# → JSON with ~5 Mirpur drain projects

# Urban standards
curl "http://localhost:3000/api/data/standards" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Keys:', list(d.keys()))"
# → ['healthcare_access', 'education_access', 'drainage', ...]
```

---

## 7. UI Functional Tests

Open **http://localhost:5173** and run through each scenario below.

### 7.1 Connection Check

- Chat panel top-right shows green Wifi icon ✅ = WebSocket connected
- Grey WifiOff icon = backend not running on port 3000

---

### 7.2 Welcome Page

URL: `http://localhost:5173/`

- Four action cards visible: **Healthcare**, **Flood Risk**, **Compare Areas**, **Accountability**
- Clicking any card navigates to `/chat` or `/accountability` and auto-sends the preset query
- Typing a custom query and pressing Enter navigates to `/chat` and sends it

---

### 7.3 Test A — Healthcare Access (Tool chain: geocode → OSM → render)

**Query:**
```
Find hospitals near Mirpur 10
```

Expected chat panel:
- Reasoning line: "Analyzing your query..."
- Tool badge: `geocode("Mirpur 10, Dhaka")` ⏳ → ✅ `lat: 23.808, lon: 90.368`
- Tool badge: `query_osm_amenities(hospital, clinic)` ⏳ → ✅ `N features found`
- Tool badge: `render_on_map(...)` ⏳ → ✅
- AI response with hospital count and names

Expected map panel:
- 🏥 Hospital markers appear on Dhaka map
- Map auto-zooms to fit all markers
- Clicking a marker shows popup: name, type, source

---

### 7.4 Test B — Flood Risk (Tool chain: geocode → infrastructure → flood → render)

**Query:**
```
Assess flood risk in Mohammadpur
```

Expected:
- `geocode` → `query_osm_infrastructure(drain, road)` → `estimate_flood_risk` tool calls
- Result lines: `Flood risk: [score]/100 ([label])`
- Map shows drain segments and road features
- AI response: risk score, drainage coverage ratio, recommendations

---

### 7.5 Test C — Air Quality (Tool chain: geocode → WAQI → response)

**Query:**
```
What is the air quality in Gulshan right now?
```

Expected:
- `geocode` → `get_air_quality` tool calls
- Result line: `AQI: [number] ([label])`
- AI response: AQI, dominant pollutant, WHO comparison
- Note: Requires `WAQI_TOKEN`. Without it the AI will explain the key is missing.

---

### 7.6 Test D — Area Comparison (Tool chain: compare_locations → multi-OSM → render)

**Query:**
```
Compare healthcare between Mirpur and Dhanmondi
```

Expected:
- Parallel tool calls for both locations
- AI response with side-by-side comparison table
- Both areas' markers rendered on map

---

### 7.7 Test E — Cost Estimation (Tool chain: estimate_intervention_cost)

**Query:**
```
How much would it cost to build medium-scale drainage in Hazaribagh?
```

Expected:
- `estimate_intervention_cost(drain, medium)` tool call
- AI response: BDT cost, USD equivalent, CPTU reference, timeline

---

### 7.8 Test F — Coverage Analysis (Tool chain: geocode → OSM → compute_service_coverage)

**Query:**
```
Analyze healthcare service coverage gaps in Dhanmondi
```

Expected:
- `geocode` → `query_osm_amenities` → `compute_service_coverage` tool calls
- Map shows red gap zones (underserved areas) overlaid on healthcare markers
- AI response: population served %, gap area, recommended clinic locations

---

## 8. Accountability Layer Tests (Tool 13)

Navigate to `http://localhost:5173/accountability` or click **🚩 Accountability — Mirpur** chip.

---

### 8.1 Test G — Infrastructure Delivery Gap (HERO DEMO)

This is **Scene 4B from the demo storyboard** — the centerpiece of the hackathon pitch.

**Query (type exactly):**
```
Check public infrastructure delivery for drainage projects in Mirpur
```

Expected tool chain (watch streaming in real-time):
1. `geocode("Mirpur, Dhaka")` ✅ → lat/lon returned
2. `check_infrastructure_delivery(drain, radius=2000)` ✅
3. Auto-render: colored flag pins appear on map as accountability data loads

Expected chat panel:
- Tool result lines show:
  - `public_projects_found: N`
  - `total_announced_budget_bdt: N crore`
  - `osm_evidence_count: N drain segments`
  - `expected_count_from_budget: N`
  - `delivery_gap_percent: N%`
- **Gap score card** rendered: progress bar + color label (`🚩 Very High` / `🔴 High` / `⚠️ Moderate` / `✅ Low`)
- **Source links** shown (IMED/e-GP URLs)
- **Yellow disclaimer box**: "⚠️ Statistical flag only. Not evidence of wrongdoing."
- AI response text includes the full disclaimer and suggests follow-up with implementing agency

Expected map panel:
- Colored flag pins appear: `🚩` red (Very High), `🔴` orange (High), `✅` green (Low)
- Clicking a flag pin opens popup:
  - Project name, budget, expected vs OSM count, gap score bar
  - Agency and year
  - [View source ↗] link to government document
  - [Ask AI About It] button → navigates to `/chat` with follow-up query
- **"🚩 N Flags Found"** button appears bottom-left of map

**Presenter talking point:**  
*"The government announced BDT 6.2 crore for drainage here. Our AI cross-references that with physical ground truth on the map. It found a delivery gap. We're not calling anyone corrupt — we're giving journalists, NGOs, and citizens a starting point to ask questions. This is what public accountability looks like in the age of AI."*

---

### 8.2 Test H — Multi-Type Accountability (Dhanmondi)

**Query:**
```
Show me infrastructure delivery gaps for public projects in Dhanmondi
```

Expected:
- Agent calls `check_infrastructure_delivery` for multiple project types (drain, road)
- Comparison results in chat with all gap scores
- Map shows colored pins for each project type

---

### 8.3 Test I — Journalist Mode (Full Area Report)

**Query:**
```
Run infrastructure delivery gap analysis for all public projects in Mirpur from 2020-2024
```

Expected:
- Multiple `check_infrastructure_delivery` calls
- Summary table in AI response: all flagged projects, ranked by gap score
- All anomaly flags rendered on map
- Accountability Panel slide-in populated with full project list

---

### 8.4 Accountability Panel (After any flag query)

Click the **🚩 N Flags Found** button (bottom-left of map):

- Panel shows: total projects analyzed, flagged count, total budget
- Filter chips: All / Very High / High / Moderate / Low
- Each project card: name, budget, gap bar, agency, year
- Clicking a project card → closes panel, opens that flag's popup on map
- **Export Report** button → copies formatted report to clipboard (shows toast notification)

---

## 9. WebSocket Message Flow (DevTools Verification)

Open **DevTools → Network → WS tab**, then send any query. Verify this frame sequence:

```json
{ "type": "reasoning", "text": "Analyzing your query...", "step": 0 }
{ "type": "tool_call", "tool": "geocode", "args": { "place_name": "Mirpur, Dhaka" } }
{ "type": "tool_result", "tool": "geocode", "result": { "lat": 23.808, "lon": 90.368 }, "duration_ms": 312 }
{ "type": "tool_call", "tool": "check_infrastructure_delivery", ... }
{ "type": "tool_result", "tool": "check_infrastructure_delivery", "result": { "delivery_gap_percent": 67, "gap_label": { "level": "Very High" } } }
{ "type": "map_render", "geojson": {...}, "style": {...}, "label": "Accountability Flags", "fit_bounds": true }
{ "type": "accountability_flags", "flags": [...] }
{ "type": "response", "text": "I found a significant infrastructure...", "done": false }
{ "type": "response", "text": "", "done": true }
```

---

## 10. Judge Q&A Scenarios

These are the hard questions judges may ask and how to demo the answer live:

| Judge Question | Live Demo Response |
|---|---|
| "Isn't this dangerous — what if you're wrong?" | Show the yellow disclaimer box. Point out: "Every output carries this mandatory disclaimer. We flag statistical anomalies — the same analysis any journalist could do manually. We never name individuals. We always link to the primary government source." |
| "What if OSM is just incomplete?" | Show the `data_confidence` field in the tool result: `MODERATE`. The AI response explicitly says "gaps may reflect OSM incompleteness, not delivery failure." |
| "Are you using private data?" | Show `/api/data/projects` response. All records link back to `imed.gov.bd` or `eprocure.gov.bd` — official public portals. Zero personal data. |
| "Could this smear someone?" | Show that results are aggregate at thana level. No individual names. The tool output schema has no `person` field. |
| "Why is this better than reading IMED reports yourself?" | Live-demo: type the accountability query. 20 seconds to get a geographic, interactive result. "vs. 3 hours manually cross-referencing PDF tables with no map." |

---

## 11. Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| WifiOff icon in chat panel | Backend not running | Run `npm run dev` from `ImpactAI/` |
| `GROQ_API_KEY is not set` in server terminal | `.env` missing key | Add `GROQ_API_KEY=gsk_...` to `.env` |
| Tool calls run but AI gives no response | Groq quota exceeded | Check console.groq.com for rate limits |
| Air quality returns error | `WAQI_TOKEN` missing | Add token to `.env` or demo without it |
| Overpass times out (504) | Mirror overloaded | Re-run warmup; lz4 endpoint is tried first |
| Map shows no layers after query | WebSocket proxy not working | Restart `pnpm dev`, check `ui/vite.config.ts` proxy |
| Flag map shows empty | No accountability query sent | Send a drainage delivery gap query first |
| `pnpm: command not found` | pnpm not installed | `npm install -g pnpm` |
| Port 3000 already in use | Previous backend running | `kill $(lsof -ti:3000)` |
| Groq `413 Request Entity Too Large` | Context too large | This is fixed — geojson blobs stripped before sending to LLM |

---

## 12. Hackathon Demo Script (Presentation Order)

Follow **Scene 4B from the Implementation Plan** as the climax:

1. Open `http://localhost:5173/` — show the welcome page with map
2. Click **🏥 Healthcare Access** card → tool chain streams, 🏥 markers appear on map
3. Click a hospital marker → show the dark popup with source attribution
4. Say: *"That's real-time OpenStreetMap data for Dhaka."*
5. Ask: *"But here's the part no other AI urban tool does."*
6. Click **🚩 Accountability — Mirpur** chip → navigates to `/accountability`
7. Type: **`Check public infrastructure delivery for drainage projects in Mirpur`**
8. Narrate as tool badges stream:
   - `geocode` → "It pinpoints the area..."
   - `check_infrastructure_delivery` → "It queries public government procurement records..."
   - "Flag pins appearing on the map..."
9. Point to the gap score card: "67% delivery gap — Very High"
10. Click a 🚩 flag pin → show popup with budget, expected count, OSM count, disclaimer
11. Click **🚩 N Flags Found** → show Accountability Panel with ranked list
12. Click **Export Report** → "This can go directly to a journalist or NGO."
13. Read the disclaimer text: *"Statistical flag only. Not evidence of wrongdoing."*
14. Close with: *"We're giving people the tools to ask the right questions — with the data to back them up."*

---

## 13. Data Sources Reference

| Data | Source | Notes |
|---|---|---|
| Geocoding | Nominatim (OpenStreetMap) | 1 req/sec rate limit — respect it |
| Infrastructure/Amenities | Overpass API (OSM) | 3 mirror endpoints; pre-cache for demos |
| Air Quality | WAQI (World Air Quality Index) | Live sensor data |
| Weather & Flood | OpenWeatherMap | Current conditions + forecast |
| Procurement Records | Pre-fetched from IMED/e-GP | 32 Dhaka projects, committed to repo |
| Admin Boundaries | HDX (thanas.geojson) | 20 thanas, local file |
| Urban Standards | WHO/BNBC/UN-Habitat | Static JSON, local file |
