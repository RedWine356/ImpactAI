# NagorMind v2 — Full Implementation Plan
## Including: Infrastructure Accountability Layer (Corruption Resolver)

> **Stack**: Gemini 2.5 Flash (free) · Express.js · Leaflet.js · Overpass API · OpenWeatherMap · WAQI · Bangladesh e-GP public data  
> **Team**: 3 people · 6 hours · Zero cost

---

## PART 0 — FREE TIER VIABILITY CHECKLIST

| Service | Free Limit | Hackathon Usage | Status |
|---------|-----------|-----------------|--------|
| Gemini 2.5 Flash | 1,500 req/day, 1M tokens/min | ~200 queries max | ✅ Free |
| Overpass API (OSM) | Unlimited (fair use) | ~500 queries | ✅ Free |
| Nominatim (geocoding) | 1 req/sec | ~100 queries | ✅ Free |
| WAQI (Air Quality) | 1,000 calls/day | ~50 calls | ✅ Free |
| OpenWeatherMap | 1,000 calls/day | ~50 calls | ✅ Free |
| Bangladesh e-GP portal | Public data, no auth | Static JSON pre-fetch | ✅ Free |
| Leaflet.js | Open source | N/A | ✅ Free |
| Express.js + Node | Open source | N/A | ✅ Free |
| Turf.js (spatial math) | Open source | N/A | ✅ Free |

**Total cost for hackathon: BDT 0**

---

## PART 1 — ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                            │
│                                                                    │
│   ┌──────────────────────┐    ┌──────────────────────────────┐   │
│   │   Chat + Reasoning    │    │   Leaflet Map (dark mode)    │   │
│   │   Panel (left)        │    │   (right)                    │   │
│   │                       │    │                              │   │
│   │  [User query]         │    │  Real-time layers:           │   │
│   │  🔍 Reasoning...      │    │  • Amenity markers           │   │
│   │  🛠️ geocode()         │    │  • Coverage radius circles   │   │
│   │  🛠️ query_osm()       │    │  • Gap zones (red)           │   │
│   │  🛠️ check_delivery()  │    │  • Accountability flags (🚩) │   │
│   │  [Agent response]     │    │  • Thana boundaries          │   │
│   │                       │    │                              │   │
│   │  ┌─────────────────┐  │    │  Side panel (on flag click): │   │
│   │  │ Accountability   │  │    │  • Project name              │   │
│   │  │ Flags panel      │  │    │  • Budget allocated          │   │
│   │  │ (slides in)      │  │    │  • Expected delivery         │   │
│   │  └─────────────────┘  │    │  • OSM evidence count        │   │
│   └──────────────────────┘    │  • Delivery gap score        │   │
│                                └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                                │ WebSocket
                    ┌───────────▼───────────┐
                    │     Express.js Backend │
                    │                        │
                    │  Agentic Loop:         │
                    │  LLM ↔ Tools ↔ Stream  │
                    └───────────┬───────────┘
                                │
       ┌────────────────────────┼───────────────────────┐
       │                        │                       │
  ┌────▼─────┐           ┌──────▼──────┐         ┌─────▼──────┐
  │ SPATIAL   │           │ ENVIRONMENT │         │ACCOUNTABILITY│
  │ TOOLS     │           │ TOOLS       │         │ LAYER       │
  │           │           │             │         │             │
  │geocode()  │           │get_aqi()    │         │check_infra_ │
  │query_osm()│           │get_weather()│         │delivery()   │
  │coverage() │           │flood_risk() │         │             │
  │compare()  │           │             │         │ [Tool 13]   │
  └───────────┘           └─────────────┘         └─────────────┘
```

---

## PART 2 — THE ACCOUNTABILITY LAYER (Tool 13)

### 2.1 The Core Idea

Bangladesh publishes public procurement data at:
- **e-GP Portal**: `eprocure.gov.bd` — all government contracts above BDT 1 lakh
- **IMED Reports**: `imed.gov.bd` — project implementation monitoring
- **RAJUK notices**: public building approvals

NagorMind's Tool 13 does one thing: **cross-reference what the government announced with what physically exists on the ground.**

It does NOT:
- Store any personal data
- Name any individual
- Make legal accusations
- Access any non-public data

It ONLY:
- Compares public spending records with OSM physical infrastructure count
- Computes a statistical delivery gap
- Flags anomalies for further human investigation
- Adds a mandatory disclaimer on every output

### 2.2 Tool 13 Specification

```javascript
// Tool 13: check_infrastructure_delivery
// Input: location + project type + optional budget figure
// Output: delivery gap score + evidence + disclaimer

async function check_infrastructure_delivery(lat, lon, radius_m, project_type, reported_budget_bdt) {
  
  // Step 1: Look up pre-fetched public procurement data
  // (JSON file pre-fetched from e-GP portal before hackathon, 
  //  filtered for Dhaka infrastructure projects 2020-2024)
  const publicProjects = await lookupPublicProjects(lat, lon, radius_m, project_type);
  
  // Step 2: Count actual physical infrastructure via OSM
  const osmCount = await queryOSMForProjectType(lat, lon, radius_m, project_type);
  
  // Step 3: Compute expected count from budget
  // Uses pre-loaded Bangladesh unit cost benchmarks
  // (from CPTU standard cost schedule — public document)
  const expectedCount = estimateFromBudget(reported_budget_bdt, project_type);
  
  // Step 4: Calculate delivery gap
  const deliveryGapScore = calculateGap(osmCount, expectedCount, publicProjects);
  
  return {
    project_type,
    public_projects_found: publicProjects.length,
    total_announced_budget_bdt: publicProjects.reduce((s, p) => s + p.budget, 0),
    osm_evidence_count: osmCount,
    expected_count_from_budget: expectedCount,
    delivery_gap_percent: deliveryGapScore,
    gap_label: gapLabel(deliveryGapScore), // "Low" / "Moderate" / "High" / "Very High"
    source_urls: publicProjects.map(p => p.source_url),
    data_confidence: "MODERATE — OSM may not capture all recent construction",
    disclaimer: "⚠️ This is a statistical anomaly flag based on public data only. " +
                "It does not constitute evidence of wrongdoing. " +
                "Gaps may reflect OSM incompleteness, project delays, or scope changes. " +
                "Use as a starting point for investigation only."
  };
}

function gapLabel(gapPercent) {
  if (gapPercent < 20) return { level: "Low", color: "#4ade80", icon: "✅" };
  if (gapPercent < 40) return { level: "Moderate", color: "#facc15", icon: "⚠️" };
  if (gapPercent < 60) return { level: "High", color: "#fb923c", icon: "🔴" };
  return { level: "Very High", color: "#ef4444", icon: "🚩" };
}
```

### 2.3 Data Pre-Fetch Strategy (Before Hackathon Starts)

Because e-GP portal doesn't have a clean API, pre-fetch the data once and store as JSON:

```bash
# Pre-fetch script (run before hackathon)
# This downloads public procurement records for Dhaka infrastructure

# Source 1: IMED project database (public)
# Go to imed.gov.bd → Annual Reports → extract Dhaka urban projects
# Save as: data/imed_dhaka_projects.json

# Source 2: RAJUK building approvals (public notices)
# Save as: data/rajuk_approvals_2020_2024.json

# Source 3: CPTU unit cost schedule (public document, PDF → JSON)
# Contains standard costs per unit for drains, roads, clinics
# Save as: data/cptu_unit_costs.json

# Structure of imed_dhaka_projects.json:
[
  {
    "project_id": "IMED-2022-DHK-0142",
    "project_name": "Mirpur drainage improvement phase 2",
    "type": "drain",
    "thana": "Mirpur",
    "lat": 23.807, "lon": 90.368,
    "budget_bdt": 45000000,
    "approved_year": 2022,
    "completion_target": 2023,
    "source_url": "https://imed.gov.bd/project/...",
    "implementing_agency": "DNCC"
  }
]
```

**Security note**: This pre-fetch JSON file:
- Contains only public, already-published government data
- Has no personal information whatsoever
- Is sourced from official government portals
- Should be committed to the GitHub repo openly (it's public data)

### 2.4 Sensitive Data Policy — What NagorMind Does and Does NOT Store

```
STORED (in pre-fetch JSON, committed to repo openly):
✅ Public project names and IDs from government portals
✅ Budget figures from officially published procurement records
✅ Location (thana-level, not ward) of public projects
✅ Implementing agency names (government bodies)
✅ Source URLs to original government documents

NEVER STORED OR PROCESSED:
❌ Names of individual contractors, engineers, or officials
❌ Personal financial data of any kind
❌ User query history (no logging of who asked what)
❌ User location (only the location they explicitly type)
❌ IP addresses of users
❌ Any data from non-public sources

DISPLAYED TO USER — WITH MANDATORY DISCLAIMER:
⚠️ Every Accountability output MUST include the disclaimer text
⚠️ Gap scores are labeled "anomaly flags" not "corruption evidence"
⚠️ Source URLs always shown so users can verify primary source themselves
```

---

## PART 3 — HOW THE USER SEES IT

### 3.1 UI Flow — Accountability Layer

The accountability features appear in three ways:

#### Flow A: Proactive Flag (Agent-initiated)

```
User types: "Analyze flood infrastructure in Mirpur 10"

Agent reasoning (visible in chat):
  🔍 "Let me check drainage infrastructure in this area..."
  🛠️ query_osm_infrastructure(23.807, 90.368, 2000, ["drain", "waterway"])
  → Found: 8 drain segments mapped
  
  🛠️ check_infrastructure_delivery(23.807, 90.368, 2000, "drain")
  → Checking public procurement records...
  → Found 2 DNCC projects totaling BDT 6.2 crore in this area (2021-2023)
  → Expected ~22 drain segments from that budget
  → OSM shows 8. Delivery gap: 64% → 🚩 Very High

[On the map: red flag icon appears over Mirpur 10 area]

Agent response:
  "Drainage infrastructure in this area shows a significant gap.
   
   OSM currently maps 8 drain segments within 2km. However, public 
   records show 2 DNCC drainage projects worth BDT 6.2 crore were 
   approved for this area between 2021-2023. Based on CPTU standard 
   unit costs, that budget should yield approximately 22 drain 
   segments.
   
   Infrastructure Delivery Gap: 🚩 VERY HIGH (64%)
   
   This may indicate: incomplete construction, unmapped infrastructure,
   project delays, or scope changes. 
   
   ⚠️ This is a statistical anomaly flag, not evidence of wrongdoing.
   Sources: [IMED Project #DNCC-2021-0089] [DNCC-2022-0134]"
```

#### Flow B: Direct Accountability Query

```
User types: "Show me infrastructure delivery gaps for public projects 
             in Dhanmondi"

Agent uses check_infrastructure_delivery() for multiple project types:
→ Roads, drains, schools, clinics checked in parallel
→ Results rendered as a comparison table in chat
→ Map shows colored pins: green (low gap) → red (very high gap)

[Side panel slides in showing ranked list of flagged projects]
```

#### Flow C: Journalist/NGO Mode (Suggested Query Chip)

The UI includes a suggested query chip:
```
[🚩 Accountability Check — Mirpur]  [🏥 Healthcare gaps]  [🌊 Flood risk]
```

Clicking the accountability chip triggers:
```
"Run infrastructure delivery gap analysis for all public projects 
 in Mirpur from 2020-2024"
```

Agent produces a full ward-level accountability report with:
- Summary table of all flagged projects
- Map with all anomaly flags rendered
- Bangla export option for ward councillors

### 3.2 Visual Design of Accountability Elements

```
On the map:
  🚩 Red flag pin   = Very High gap (>60%)
  🔴 Orange pin     = High gap (40-60%)
  ⚠️  Yellow pin    = Moderate gap (20-40%)
  ✅ Green pin      = Low gap (<20%)

Clicking any flag pin opens a popup:
  ┌────────────────────────────────────┐
  │ 🚩 Mirpur Drainage Phase 2        │
  │ Budget: BDT 4.5 Crore (2022)      │
  │ Expected: ~18 drain segments      │
  │ OSM found: 6 segments             │
  │ Gap Score: 67% — Very High        │
  │ Agency: DNCC                      │
  │ [View source ↗] [Ask AI about it] │
  │                                    │
  │ ⚠️ Statistical flag only.          │
  │ Not evidence of wrongdoing.        │
  └────────────────────────────────────┘
```

---

## PART 4 — 13-TOOL COMPLETE LIST

| # | Tool | Purpose | Source |
|---|------|---------|--------|
| 1 | `geocode(place_name)` | Text → lat/lon | Nominatim |
| 2 | `query_osm_amenities(lat, lon, r, types[])` | Hospitals, schools, clinics | Overpass |
| 3 | `query_osm_infrastructure(lat, lon, r, types[])` | Roads, drains, bridges | Overpass |
| 4 | `get_boundary(area_name)` | Admin polygons | HDX/OSM cached |
| 5 | `get_air_quality(lat, lon)` | AQI + pollutants | WAQI + OWM |
| 6 | `get_weather(lat, lon)` | Weather + forecast | OpenWeatherMap |
| 7 | `compute_service_coverage(lat, lon, r, type)` | Gap analysis | Turf.js + OSM |
| 8 | `estimate_flood_risk(lat, lon, r)` | Flood vulnerability | OSM drains + land cover |
| 9 | `compare_locations(loc_a, loc_b, metrics[])` | Side-by-side analysis | Multi-tool |
| 10 | `estimate_intervention_cost(type, scale)` | Cost estimates | CPTU lookup table |
| 11 | `search_urban_standards(metric)` | WHO/BNBC benchmarks | Pre-loaded JSON |
| 12 | `render_on_map(geojson, style, label)` | Visualization | WebSocket → Leaflet |
| **13** | **`check_infrastructure_delivery(lat, lon, r, type)`** | **Delivery gap vs. public spend** | **e-GP/IMED pre-fetched JSON** |

---

## PART 5 — 6-HOUR BUILD TIMELINE (WITH ACCOUNTABILITY LAYER)

> **Person A** = Frontend  
> **Person B** = Backend + Data  
> **Person C** = AI/Agent + Demo

### Phase 1: Foundation (0:00–1:30) — Same as v2 plan

Focus: Get the basic chat + map + agentic loop running.  
Tool 13 is NOT built yet. Placeholder only.

### Phase 2: Intelligence + Accountability (1:30–3:00)

| Time | A (Frontend) | B (Backend) | C (AI/Agent) |
|------|-------------|------------|--------------|
| **1:30–2:00** | Add accountability flag rendering on map: red/orange/yellow/green pins. Popup component. | Pre-process e-GP/IMED JSON into indexed lookup by thana + type. Implement `check_infrastructure_delivery()` core logic. | Add Tool 13 schema to tool definitions. Add to system prompt: when analyzing infrastructure, ALWAYS check delivery gap if procurement data exists. |
| **2:00–2:30** | Add side panel: "Accountability Flags" slides in from right when flags exist on map. Ranked list of flagged projects. | Unit test gap calculation with known data (Mirpur drainage 2022 as ground truth). Tune expected counts using CPTU unit costs. | Test: "Analyze drainage in Mirpur" → verify agent calls check_delivery, renders flags on map, includes disclaimer in response. |
| **2:30–3:00** | Add accountability chip to suggested queries. Add disclaimer banner styling (amber, non-dismissable). | Cache all pre-fetched accountability data. Ensure fallback: if no procurement record found, agent says "No public projects found in records for this area — analysis limited to physical infrastructure only." | Test journalist flow: "Show me delivery gaps in Dhanmondi" → full report generated. Fix any prompt issues. |

### Phase 3: Polish (3:00–4:30) — Standard + accountability-specific

- Pre-cache all demo queries INCLUDING the accountability demo
- Test: flags appear correctly, popups work, disclaimer always shows
- Record a B-roll of the accountability demo specifically (it's a strong standalone moment)

### Phase 4: Ship (4:30–6:00) — Standard

---

## PART 6 — DEMO STORYBOARD (UPDATED WITH ACCOUNTABILITY SCENE)

### Scene 4B: The Accountability Reveal (replaces or follows comparison scene)

**Setup**: After showing healthcare access analysis...

Presenter: *"But here's the part no other AI urban tool does."*

Types: **"Check public infrastructure delivery for drainage projects in Mirpur"**

**What happens:**
1. Agent: `🛠️ check_infrastructure_delivery(23.807, 90.368, 2000, "drain")`
2. Agent (streaming): *"Checking public procurement records for this area..."*
3. Agent: *"Found 2 DNCC projects totaling BDT 6.2 crore approved 2021-2023..."*
4. Agent: *"Querying OSM for actual drain segments..."*
5. **On map: 3 red flag pins appear** — one for each flagged project location
6. Agent delivers response with gap score: **67% — Very High 🚩**
7. Accountability panel slides in on the right with ranked list

**Presenter**: *"The government announced BDT 6.2 crore for drainage here. Our AI cross-references that with physical ground truth. It found a 67% delivery gap. We're not calling anyone corrupt — we're giving journalists, NGOs, and citizens a starting point to ask questions. This is what public accountability looks like in the age of AI."*

**Why judges respond to this:**
- It's emotionally resonant — corruption in Bangladesh infrastructure is universally understood
- It's clearly framed safely — statistical flag, not accusation
- It's genuinely novel — no competitor at this hackathon will have thought of this
- It directly hits "societal impact" (+5 rubric points)

---

## PART 7 — HARD QUESTIONS ON THE ACCOUNTABILITY LAYER

| Judge Question | Answer |
|----------------|--------|
| "Isn't this dangerous? What if you're wrong?" | "Every output carries a mandatory disclaimer. We flag statistical anomalies in public data — the same analysis any journalist could do manually. We never name individuals. We always link to the primary government source so the user can verify. We're a signal, not a verdict." |
| "What if OSM is just incomplete?" | "The agent explicitly says this. It reports data confidence as MODERATE and explains that gaps may reflect mapping incompleteness, not delivery failure. That's the honest answer." |
| "Are you using private data?" | "No. Every data source is either OSM (public global database) or official Bangladesh government portals — e-GP, IMED, RAJUK — all publicly accessible without authentication. We pre-fetch it, but we link directly to the source URL in every output." |
| "Could this be misused to smear someone?" | "The system produces aggregate statistics at thana level, not accusation reports against individuals. A thana with a 60% drain delivery gap is a fact that deserves scrutiny regardless of who managed the project." |
| "Why is this better than just reading the IMED reports yourself?" | "IMED reports are PDF tables. We make it geographic and interactive — drop a pin, ask a question, get the answer in 30 seconds instead of 3 hours. And we cross-reference with physical ground truth, which the IMED reports don't do at all." |

---

## PART 8 — REVISED RUBRIC SCORING

| Dimension | v2 Base | +Accountability | Justification |
|-----------|:-------:|:---------------:|---------------|
| **Problem Relevance** | 18 | **+1 = 19** | Accountability adds a second, sharp problem: infrastructure delivery transparency. Highly relevant to Bangladesh context. |
| **Innovation & Creativity** | 18 | **+1 = 19** | No team will combine urban AI + public procurement cross-referencing. The concept is genuinely creative. |
| **Technical Execution** | 18 | **+0 = 18** | Accountability tool is relatively simple (JSON lookup + ratio calculation). Doesn't add technical complexity, but doesn't detract. |
| **Feasibility & Scalability** | 19 | **+0 = 19** | The pre-fetch approach is pragmatic. All data sources are real and accessible. |
| **Presentation & Pitch** | 17 | **+2 = 19** | The accountability demo scene is the most emotionally resonant moment of the pitch. Judges remember it. Strong storytelling. |
| **TOTAL** | 90 | **+4 = 94** | Four points higher. Every point earned through genuine differentiation. |

---

## PART 9 — PROJECT DESCRIPTION (5-6 LINES FOR SUBMISSION)

```
NagorMind is an AI urban planning advisor for Dhaka that lets anyone — 
citizens, journalists, NGOs, developers, or planners — ask any question 
about the city's infrastructure and watch the AI investigate using live 
data. Built on a 13-tool agentic loop with Gemini 2.5 Flash, it queries 
OpenStreetMap, live AQI sensors, weather APIs, and public government 
procurement records in real-time, rendering evidence on an interactive 
map as it reasons. Its Accountability Layer cross-references official 
e-GP/IMED project spending against physical ground truth, flagging 
infrastructure delivery gaps for public scrutiny — not as accusations, 
but as statistical anomalies with full source transparency.
```

---

## PART 10 — REPOSITORY STRUCTURE

```
nagormind/
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx               # Split-screen layout
│   │   ├── ChatPanel.jsx         # Streaming chat + tool call display
│   │   ├── MapPanel.jsx          # Leaflet map + reactive layers
│   │   ├── AccountabilityPanel.jsx  # Slide-in flags list
│   │   └── components/
│   │       ├── ToolCallBadge.jsx  # 🛠️ tool call visualization
│   │       ├── FlagPopup.jsx      # Map pin popup with disclaimer
│   │       └── GapMeter.jsx       # Delivery gap score bar
├── server/
│   ├── index.js                  # Express server + WebSocket
│   ├── agent.js                  # Agentic loop (Gemini API)
│   ├── tools/
│   │   ├── spatial.js            # Tools 1-4
│   │   ├── environment.js        # Tools 5-6
│   │   ├── analysis.js           # Tools 7-11
│   │   ├── render.js             # Tool 12 (WebSocket push)
│   │   └── accountability.js     # Tool 13 ← NEW
│   └── prompts/
│       └── system_prompt.txt     # Urban planning domain prompt
├── data/
│   ├── imed_dhaka_projects.json  # Pre-fetched IMED data (public)
│   ├── egp_dhaka_contracts.json  # Pre-fetched e-GP data (public)
│   ├── cptu_unit_costs.json      # Standard unit costs (public)
│   ├── dhaka_thanas.geojson      # HDX admin boundaries (public)
│   └── urban_standards.json     # WHO/BNBC benchmarks
├── .env.example                  # API keys template (no secrets)
├── README.md
└── package.json
```

**Note on `data/` folder**: All JSON files contain only public government data. Commit them openly. This actually STRENGTHENS the accountability story — "our data sources are fully transparent and publicly verifiable."

---

## PART 11 — SYSTEM PROMPT SNIPPET (ACCOUNTABILITY SECTION)

Add this block to the system prompt:

```
ACCOUNTABILITY ANALYSIS PROTOCOL:

When a user asks about infrastructure (drains, roads, clinics, schools) in any 
Dhaka area, you SHOULD proactively call check_infrastructure_delivery() if:
- The user mentions flood risk, drainage, or public health infrastructure
- The user asks about government projects or public spending
- The user is identified as a journalist, NGO worker, or researcher

When check_infrastructure_delivery() returns a gap score:
- ALWAYS include the full disclaimer text in your response
- Present the gap as a "delivery anomaly" or "statistical gap", never as "corruption"
- ALWAYS cite the specific government source documents
- Explain possible non-malicious reasons for the gap (OSM incompleteness, delays, scope changes)
- If gap_label is "Very High" or "High", suggest the user follow up with the implementing agency or a journalist

You NEVER:
- Name individual officials or contractors in connection with gaps
- State or imply that wrongdoing occurred
- Draw legal conclusions of any kind
- Amplify unverified claims

Your role is to surface publicly-available evidence and help users ask better questions.
```

---

*NagorMind v2 + Accountability Layer — Impact Dhaka Hackathon*  
*Generated: April 2026*
