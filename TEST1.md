# TEST1 — NagorMind v2.1 Quick Test Guide

## Data Stats
- **97 public infrastructure projects** (59 IMED + 38 e-GP)
- **25 thanas** covered across Dhaka
- **BDT 306.4 Crore** total tracked budget
- **5 project types**: drain (42), road (32), clinic (11), school (8), bridge (4)

---

## Quick Start (2 terminals)

### Terminal 1 — Backend
```bash
cd /home/lucifer36/Documents/impact_dhaka/ImpactAI
npm run dev
```
You should see:
```
NagorMind Backend v2.1 (LangChain Agent)
[Data] Loaded 97 projects, 20 thanas
[LangChain] Agent ready with 13 DynamicStructuredTools
```

### Terminal 2 — Frontend
```bash
cd /home/lucifer36/Documents/impact_dhaka/ImpactAI/ui
pnpm dev
```
Open **http://localhost:5173** in browser.

---

## Curl Tests (run while backend is up)

### 1. Health check
```bash
curl -s http://localhost:3000/api/health | python3 -m json.tool
```
Check: `langchain: "active"`, 13 tools, version 2.1.0

### 2. Simple geocode
```bash
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"query":"Where is Mirpur 10?"}'
```
Check: response has lat/lon, `framework: "langchain"`, `tools_used` includes `geocode`

### 3. Air quality
```bash
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"query":"Air quality in Dhanmondi"}'
```
Check: AQI number returned, tools include `get_air_quality`

### 4. Find hospitals
```bash
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"query":"Find hospitals near Gulshan"}'
```
Check: hospital count, tools include `geocode`, `query_osm_amenities`

### 5. Accountability check
```bash
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"query":"Check drainage delivery gaps in Mirpur"}'
```
Check: delivery gap %, disclaimer text, tools include `check_infrastructure_delivery`

### 6. Project data API
```bash
curl -s http://localhost:3000/api/data/projects | python3 -c "import sys,json;d=json.load(sys.stdin);print('Total:',d['total'])"
curl -s "http://localhost:3000/api/data/projects?thana=Mirpur" | python3 -c "import sys,json;d=json.load(sys.stdin);print('Mirpur projects:',d['total'])"
curl -s "http://localhost:3000/api/data/projects?type=drain" | python3 -c "import sys,json;d=json.load(sys.stdin);print('Drain projects:',d['total'])"
```
Check: 97 total, ~8 Mirpur, ~42 drain

---

## UI Test Checklist

### Welcome Page (http://localhost:5173)
- [ ] `v2.1 · LangChain` badge (cyan) next to NagorMind logo
- [ ] 4 action cards: Healthcare, Flood Risk, Compare, Accountability
- [ ] Tech badges: "LangChain Agent", "Groq LLM", "13 AI Tools", "RAG Pipeline"
- [ ] "Powered by LangChain AgentExecutor + ChatGroq" at bottom
- [ ] 4 query chips at top row

### Chat Page — Click "Healthcare Access" card
- [ ] Navigates to /chat with auto-query
- [ ] Cyan `CHAIN` badge on agent reasoning
- [ ] Tool call badges appear: `geocode(...)`, `query_osm_amenities(...)`
- [ ] Green checkmarks on completed tools
- [ ] Map shows hospital/clinic markers
- [ ] Response text with data
- [ ] Footer: `LangChain · llama-3.3-70b-versatile · X tools · Xs`

### Chat Page — Type "Assess flood risk in Mohammadpur"
- [ ] Multiple tool calls: geocode, query_osm_infrastructure, get_weather
- [ ] Flood risk score in response
- [ ] Map shows infrastructure data

### Accountability Page — Click "Infrastructure Accountability" card
- [ ] Both `v2.1 · LangChain` and `accountability` badges
- [ ] Agent calls geocode then check_infrastructure_delivery
- [ ] Color-coded delivery gap card (green/yellow/orange/red bar)
- [ ] Gap percentage number and bar
- [ ] Source URLs linked (IMED/e-GP)
- [ ] Amber disclaimer banner (always visible)
- [ ] Map shows flag pins with colors
- [ ] "Flags Found" button at bottom-left
- [ ] Click flag pin → popup with project details

### Connection
- [ ] Green wifi icon when connected
- [ ] Auto-reconnects if backend restarts

---

## What Changed (for judges)

| Feature | Before | After |
|---------|--------|-------|
| Agent framework | Manual Groq API loop | **LangChain AgentExecutor + LangGraph ReAct** |
| Tool system | Raw JSON tool calls | **13 DynamicStructuredTool with Zod schemas** |
| Model | Groq direct HTTP | **ChatGroq via @langchain/groq** |
| Fallback | Heuristic fallback | **LangChain → Legacy agent → Heuristic** |
| REST API | None | **POST /api/chat** |
| Project data | 32 projects | **97 projects across 25 thanas** |
| Budget tracked | ~BDT 100 Cr | **BDT 306.4 Crore** |
| UI branding | Generic v2 | **LangChain badges, chain visualization, metadata footer** |

---

## Architecture

```
User → React UI (Vite) → WebSocket → Express.js
                                        ↓
                              LangChain AgentExecutor
                              (LangGraph createReactAgent)
                                        ↓
                              ChatGroq (Llama 3.3 70B)
                                        ↓
                              13 DynamicStructuredTools
                             ┌──────┼──────┬──────┐
                          Spatial  Env  Analysis  Accountability
                          (OSM)   (AQI) (Turf.js) (IMED/e-GP)
```
