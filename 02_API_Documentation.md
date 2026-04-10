# NagorMind — Complete API Documentation

> **Version**: 2.0  
> **Base URL**: `http://localhost:3000`  
> **WebSocket**: `ws://localhost:3000/ws`  
> **Protocol**: REST (setup) + WebSocket (real-time chat/map)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [WebSocket Protocol](#2-websocket-protocol)
3. [REST Endpoints](#3-rest-endpoints)
4. [Tool Definitions (13 Tools)](#4-tool-definitions)
5. [Gemini Agent Integration](#5-gemini-agent-integration)
6. [Data Models](#6-data-models)
7. [Error Handling](#7-error-handling)
8. [Rate Limiting & Caching](#8-rate-limiting--caching)

---

## 1. Architecture Overview

```
Client (Browser)
    │
    ├── HTTP GET  /api/health          → Server status
    ├── HTTP GET  /api/data/thanas     → Pre-loaded GeoJSON
    ├── HTTP GET  /api/data/standards  → Urban benchmarks
    │
    └── WebSocket /ws
         ├── client → server:  { type: "query", text: "..." }
         ├── server → client:  { type: "reasoning", text: "..." }
         ├── server → client:  { type: "tool_call", tool: "...", args: {...} }
         ├── server → client:  { type: "tool_result", tool: "...", result: {...} }
         ├── server → client:  { type: "response", text: "..." }
         ├── server → client:  { type: "map_render", geojson: {...}, style: {...} }
         └── server → client:  { type: "error", message: "..." }
```

---

## 2. WebSocket Protocol

### 2.1 Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
```

### 2.2 Client → Server Messages

#### `query` — Send a user question

```json
{
  "type": "query",
  "text": "Analyze flood infrastructure in Mirpur 10",
  "session_id": "optional-session-uuid"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✅ | Always `"query"` |
| `text` | string | ✅ | User's natural language question |
| `session_id` | string | ❌ | Optional session ID for conversation continuity |

#### `cancel` — Cancel an in-progress query

```json
{
  "type": "cancel",
  "session_id": "session-uuid"
}
```

### 2.3 Server → Client Messages

#### `reasoning` — Agent thinking (streamed tokens)

```json
{
  "type": "reasoning",
  "text": "Let me check drainage infrastructure in this area...",
  "step": 1,
  "total_steps": 4
}
```

#### `tool_call` — Agent calling a tool

```json
{
  "type": "tool_call",
  "tool": "query_osm_infrastructure",
  "args": {
    "lat": 23.807,
    "lon": 90.368,
    "radius_m": 2000,
    "types": ["drain", "waterway"]
  },
  "step": 2,
  "total_steps": 4
}
```

#### `tool_result` — Tool execution result

```json
{
  "type": "tool_result",
  "tool": "query_osm_infrastructure",
  "result": {
    "count": 8,
    "items": [...],
    "source": "Overpass API"
  },
  "duration_ms": 1245,
  "step": 2,
  "total_steps": 4
}
```

#### `response` — Final agent response (streamed)

```json
{
  "type": "response",
  "text": "Drainage infrastructure in this area shows a significant gap...",
  "done": false
}
```

When streaming is complete:

```json
{
  "type": "response",
  "text": "",
  "done": true,
  "metadata": {
    "tools_used": ["geocode", "query_osm_infrastructure", "check_infrastructure_delivery"],
    "total_duration_ms": 4523,
    "token_count": 847
  }
}
```

#### `map_render` — Push visualization to map

```json
{
  "type": "map_render",
  "action": "add_layer",
  "layer_id": "drain_coverage_mirpur",
  "geojson": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "style": {
    "type": "circle",
    "color": "#00d4ff",
    "opacity": 0.15,
    "radius": 2000
  },
  "label": "Drainage coverage — Mirpur 10",
  "fit_bounds": true
}
```

#### `accountability_flags` — Push flag pins to map

```json
{
  "type": "accountability_flags",
  "flags": [
    {
      "id": "flag-001",
      "lat": 23.807,
      "lon": 90.368,
      "project_name": "Mirpur Drainage Phase 2",
      "budget_bdt": 45000000,
      "expected_count": 18,
      "osm_count": 6,
      "gap_percent": 67,
      "gap_label": "Very High",
      "gap_color": "#ef4444",
      "gap_icon": "🚩",
      "agency": "DNCC",
      "year": 2022,
      "source_url": "https://imed.gov.bd/project/...",
      "disclaimer": "⚠️ Statistical anomaly flag only. Not evidence of wrongdoing."
    }
  ]
}
```

#### `error` — Error message

```json
{
  "type": "error",
  "message": "Rate limit exceeded for Overpass API. Please wait 30 seconds.",
  "code": "RATE_LIMIT",
  "recoverable": true
}
```

---

## 3. REST Endpoints

### `GET /api/health`

Health check endpoint.

**Response** `200 OK`:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "uptime_seconds": 3456,
  "services": {
    "gemini": "connected",
    "overpass": "available",
    "waqi": "available",
    "openweathermap": "available"
  }
}
```

---

### `GET /api/data/thanas`

Returns pre-loaded Dhaka thana boundary GeoJSON.

**Response** `200 OK`:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Mirpur",
        "name_bn": "মিরপুর",
        "zone": "DNCC"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[90.35, 23.79], ...]]
      }
    }
  ]
}
```

---

### `GET /api/data/standards`

Returns urban planning benchmarks (WHO/BNBC).

**Response** `200 OK`:
```json
{
  "healthcare": {
    "who_standard": "1 hospital per 10,000 population",
    "who_clinic_radius_m": 2000,
    "bangladesh_standard": "1 UHC per upazila"
  },
  "education": {
    "standard": "1 primary school per 1,500 children",
    "max_travel_distance_m": 1500
  },
  "drainage": {
    "standard": "continuous drain network along all major roads",
    "coverage_ratio": 0.8
  }
}
```

---

### `GET /api/data/projects?thana={name}&type={type}`

Returns pre-fetched government project data filtered by thana and type.

**Query Parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `thana` | string | ❌ | Filter by thana name (e.g., "Mirpur") |
| `type` | string | ❌ | Filter by project type: `drain`, `road`, `clinic`, `school`, `bridge` |
| `year_from` | number | ❌ | Filter projects from this year |
| `year_to` | number | ❌ | Filter projects up to this year |

**Response** `200 OK`:
```json
{
  "total": 5,
  "projects": [
    {
      "project_id": "IMED-2022-DHK-0142",
      "project_name": "Mirpur drainage improvement phase 2",
      "type": "drain",
      "thana": "Mirpur",
      "lat": 23.807,
      "lon": 90.368,
      "budget_bdt": 45000000,
      "approved_year": 2022,
      "completion_target": 2023,
      "source_url": "https://imed.gov.bd/project/...",
      "implementing_agency": "DNCC"
    }
  ]
}
```

---

## 4. Tool Definitions (13 Tools)

Each tool is a function the Gemini agent can call. Below is the complete specification for each.

---

### Tool 1: `geocode`

**Purpose**: Convert place name to geographic coordinates.  
**External API**: Nominatim (OpenStreetMap)

```typescript
interface GeocodeInput {
  place_name: string;  // e.g., "Mirpur 10, Dhaka"
}

interface GeocodeOutput {
  lat: number;
  lon: number;
  display_name: string;
  osm_type: string;
  bounding_box: [number, number, number, number]; // [south, north, west, east]
  confidence: "HIGH" | "MEDIUM" | "LOW";
}
```

**Example Call**:
```json
{
  "tool": "geocode",
  "args": { "place_name": "Mirpur 10, Dhaka" }
}
```

**Example Response**:
```json
{
  "lat": 23.8069,
  "lon": 90.3687,
  "display_name": "Mirpur 10, Mirpur, Dhaka, Bangladesh",
  "osm_type": "node",
  "bounding_box": [23.795, 23.820, 90.355, 90.385],
  "confidence": "HIGH"
}
```

**Implementation Notes**:
- Rate limit: 1 request/second (Nominatim policy)
- Cache results to avoid repeated calls
- Add `User-Agent: NagorMind/2.0` header (required by Nominatim)
- Endpoint: `https://nominatim.openstreetmap.org/search?q={query}&format=json&countrycodes=bd`

---

### Tool 2: `query_osm_amenities`

**Purpose**: Find hospitals, schools, clinics, and other amenities within a radius.  
**External API**: Overpass API (OpenStreetMap)

```typescript
interface QueryOSMAmenitiesInput {
  lat: number;
  lon: number;
  radius_m: number;           // Search radius in meters
  types: string[];            // e.g., ["hospital", "clinic", "school", "pharmacy"]
}

interface AmenityResult {
  osm_id: number;
  name: string | null;
  name_bn: string | null;     // Bangla name if available
  type: string;               // e.g., "hospital"
  lat: number;
  lon: number;
  tags: Record<string, string>; // All OSM tags
}

interface QueryOSMAmenitiesOutput {
  total_count: number;
  by_type: Record<string, number>;  // { "hospital": 3, "clinic": 7 }
  items: AmenityResult[];
  query_area_km2: number;
  source: "Overpass API (OpenStreetMap)";
}
```

**Overpass QL Query Template**:
```
[out:json][timeout:25];
(
  node["amenity"~"hospital|clinic|school"](around:{radius_m},{lat},{lon});
  way["amenity"~"hospital|clinic|school"](around:{radius_m},{lat},{lon});
);
out center body;
```

**Example Response**:
```json
{
  "total_count": 12,
  "by_type": { "hospital": 3, "clinic": 7, "pharmacy": 2 },
  "items": [
    {
      "osm_id": 12345678,
      "name": "Mirpur General Hospital",
      "name_bn": "মিরপুর জেনারেল হাসপাতাল",
      "type": "hospital",
      "lat": 23.808,
      "lon": 90.367,
      "tags": { "beds": "200", "emergency": "yes" }
    }
  ],
  "query_area_km2": 12.57,
  "source": "Overpass API (OpenStreetMap)"
}
```

---

### Tool 3: `query_osm_infrastructure`

**Purpose**: Find physical infrastructure — roads, drains, bridges, waterways.  
**External API**: Overpass API

```typescript
interface QueryOSMInfrastructureInput {
  lat: number;
  lon: number;
  radius_m: number;
  types: string[];  // ["drain", "road", "bridge", "waterway", "culvert"]
}

interface InfrastructureResult {
  osm_id: number;
  name: string | null;
  type: string;
  geometry_type: "node" | "way" | "relation";
  length_m: number | null;    // For ways (roads, drains)
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface QueryOSMInfrastructureOutput {
  total_count: number;
  by_type: Record<string, number>;
  total_length_km: number;           // Total length of linear features
  items: InfrastructureResult[];
  source: "Overpass API (OpenStreetMap)";
}
```

**Type → OSM Tag Mapping**:

| Input type | Overpass tags |
|-----------|--------------|
| `drain` | `"waterway"="drain"` or `"man_made"="drainage"` |
| `road` | `"highway"~"primary\|secondary\|tertiary\|residential"` |
| `bridge` | `"bridge"="yes"` |
| `waterway` | `"waterway"~"river\|canal\|stream"` |
| `culvert` | `"tunnel"="culvert"` |

---

### Tool 4: `get_boundary`

**Purpose**: Get admin boundary polygon for a named area (thana/district).  
**Source**: Pre-loaded GeoJSON from HDX / OSM (cached in `data/dhaka_thanas.geojson`)

```typescript
interface GetBoundaryInput {
  area_name: string;  // e.g., "Mirpur", "Dhanmondi", "Gulshan"
}

interface GetBoundaryOutput {
  name: string;
  name_bn: string;
  admin_level: number;
  zone: string;             // "DNCC" or "DSCC"
  geometry: GeoJSON.Polygon;
  area_km2: number;
  centroid: { lat: number; lon: number };
  found: boolean;
}
```

**Implementation Notes**:
- Loaded from local file at server startup — no external API call
- Fuzzy match on area_name (handle "Mirpur", "mirpur", "Mirpur Thana")
- Fallback: query OSM Nominatim for boundary if not in local cache

---

### Tool 5: `get_air_quality`

**Purpose**: Get current Air Quality Index and pollutant breakdown.  
**External API**: WAQI (World Air Quality Index)

```typescript
interface GetAirQualityInput {
  lat: number;
  lon: number;
}

interface GetAirQualityOutput {
  aqi: number;                    // Overall AQI (0-500+)
  aqi_label: string;              // "Good" | "Moderate" | "Unhealthy for Sensitive" | "Unhealthy" | "Very Unhealthy" | "Hazardous"
  dominant_pollutant: string;     // "pm25", "pm10", "o3", etc.
  pollutants: {
    pm25: number | null;
    pm10: number | null;
    o3: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
  };
  station_name: string;
  station_distance_km: number;
  timestamp: string;              // ISO 8601
  source: "WAQI API";
  who_guideline_pm25: 15;         // WHO annual guideline
  exceedance_factor: number;      // How many times above WHO guideline
}
```

**API Details**:
- Endpoint: `https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}`
- Free tier: 1,000 calls/day
- Token required: Get from https://aqicn.org/data-platform/token/

---

### Tool 6: `get_weather`

**Purpose**: Get current weather and short-term forecast.  
**External API**: OpenWeatherMap

```typescript
interface GetWeatherInput {
  lat: number;
  lon: number;
}

interface GetWeatherOutput {
  current: {
    temp_c: number;
    feels_like_c: number;
    humidity_percent: number;
    wind_speed_mps: number;
    description: string;         // "scattered clouds"
    rain_1h_mm: number | null;
    visibility_m: number;
  };
  forecast_24h: {
    max_temp_c: number;
    min_temp_c: number;
    rain_probability: number;    // 0-1
    total_rain_mm: number;
    description: string;
  };
  flood_relevance: {
    recent_rain_mm: number;      // Rainfall in last 3 days
    heavy_rain_alert: boolean;   // true if >50mm expected in 24h
  };
  source: "OpenWeatherMap API";
}
```

**API Details**:
- Current: `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={KEY}&units=metric`
- Forecast: `https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={KEY}&units=metric`
- Free tier: 1,000 calls/day
- Key required: Get from https://openweathermap.org/api

---

### Tool 7: `compute_service_coverage`

**Purpose**: Analyze how well a service type covers an area (gap analysis).  
**Source**: Computed locally using Turf.js + OSM data

```typescript
interface ComputeServiceCoverageInput {
  lat: number;
  lon: number;
  radius_m: number;
  service_type: string;          // "hospital", "clinic", "school", "pharmacy"
  coverage_radius_m?: number;    // Default: type-specific (hospital=5000, clinic=2000, school=1500)
}

interface ComputeServiceCoverageOutput {
  area_analyzed_km2: number;
  service_count: number;
  population_estimate: number;       // Rough estimate from area density
  coverage_percent: number;          // % of area within coverage radius of at least one facility
  gap_zones: GeoJSON.FeatureCollection;  // Polygons of uncovered areas
  recommended_new_locations: Array<{
    lat: number;
    lon: number;
    reason: string;
  }>;
  benchmark: string;                 // WHO/BNBC standard
  meets_benchmark: boolean;
  source: "Turf.js spatial analysis on OSM data";
}
```

**Implementation Notes**:
- Uses Turf.js `buffer()` for coverage circles
- Uses Turf.js `difference()` to compute uncovered area
- Population density estimate: 45,000/km² for Dhaka (configurable)

---

### Tool 8: `estimate_flood_risk`

**Purpose**: Assess flood vulnerability based on drainage, elevation proxy, and weather.  
**Source**: Composite of OSM drain data + weather + heuristics

```typescript
interface EstimateFloodRiskInput {
  lat: number;
  lon: number;
  radius_m: number;
}

interface EstimateFloodRiskOutput {
  flood_risk_score: number;         // 0-100
  risk_label: "Low" | "Moderate" | "High" | "Very High";
  factors: {
    drain_density_per_km: number;   // Drain segments per km of road
    drain_coverage_ratio: number;   // 0-1
    recent_rainfall_mm: number;     // From weather API
    waterway_proximity_m: number;   // Distance to nearest river/canal
    road_density_per_km2: number;   // Proxy for imperviousness
  };
  vulnerable_spots: Array<{
    lat: number;
    lon: number;
    reason: string;                 // "no drain within 500m of major road"
  }>;
  recommendations: string[];
  source: "Composite analysis (OSM + OpenWeatherMap)";
}
```

**Risk Scoring Formula**:
```
score = (100 - drain_coverage * 40) 
      + (rainfall_factor * 20) 
      + (waterway_proximity_factor * 20) 
      + (imperviousness_factor * 20)
```

---

### Tool 9: `compare_locations`

**Purpose**: Side-by-side comparison of two areas across multiple metrics.  
**Source**: Multi-tool orchestration (calls other tools internally)

```typescript
interface CompareLocationsInput {
  location_a: string;  // Place name
  location_b: string;  // Place name
  metrics: string[];   // ["healthcare", "education", "air_quality", "flood_risk", "infrastructure"]
}

interface CompareLocationsOutput {
  location_a: {
    name: string;
    lat: number;
    lon: number;
    metrics: Record<string, any>;
  };
  location_b: {
    name: string;
    lat: number;
    lon: number;
    metrics: Record<string, any>;
  };
  comparison_summary: string;       // AI-generated summary
  better_area: Record<string, string>; // { "healthcare": "location_a", "air_quality": "location_b" }
}
```

---

### Tool 10: `estimate_intervention_cost`

**Purpose**: Estimate cost for a proposed infrastructure intervention.  
**Source**: Pre-loaded CPTU unit cost schedule (`data/cptu_unit_costs.json`)

```typescript
interface EstimateInterventionCostInput {
  intervention_type: string;  // "drain", "clinic", "road_repair", "school", "bridge"
  scale: string;              // "small", "medium", "large"
  location_context?: string;  // Optional area name for context
}

interface EstimateInterventionCostOutput {
  intervention_type: string;
  scale: string;
  estimated_cost_bdt: number;
  estimated_cost_usd: number;
  cost_breakdown: Array<{
    item: string;
    unit: string;
    quantity: number;
    unit_cost_bdt: number;
    subtotal_bdt: number;
  }>;
  timeline_months: number;
  reference: "CPTU Standard Cost Schedule 2023-24";
  disclaimer: "Estimates based on government unit cost standards. Actual costs may vary.";
}
```

**Unit Cost Reference Table** (from CPTU):

| Type | Scale | Description | Est. Cost (BDT) |
|------|-------|-------------|-----------------|
| drain | small | 500m box drain | 5,000,000 |
| drain | medium | 1km box drain | 12,000,000 |
| drain | large | 2km trunk drain | 30,000,000 |
| clinic | small | Community clinic setup | 8,000,000 |
| clinic | medium | UHC upgrade | 25,000,000 |
| road_repair | small | 500m road resurfacing | 3,000,000 |
| road_repair | medium | 1km road widening | 15,000,000 |
| school | medium | Primary school (6 room) | 20,000,000 |
| bridge | small | Pedestrian bridge | 10,000,000 |
| bridge | medium | Road bridge (50m) | 80,000,000 |

---

### Tool 11: `search_urban_standards`

**Purpose**: Look up WHO, BNBC, or international urban planning benchmarks.  
**Source**: Pre-loaded JSON (`data/urban_standards.json`)

```typescript
interface SearchUrbanStandardsInput {
  metric: string;  // "healthcare_access", "drainage", "green_space", "air_quality", "road_density"
}

interface SearchUrbanStandardsOutput {
  metric: string;
  standards: Array<{
    authority: string;         // "WHO", "BNBC", "UN-Habitat"
    standard: string;          // Human-readable description
    threshold: number | null;  // Numeric threshold if applicable
    unit: string | null;
    year: number;
    source_url: string;
  }>;
  dhaka_current: string;       // Current status in Dhaka if known
  gap_assessment: string;      // How Dhaka compares to standard
}
```

---

### Tool 12: `render_on_map`

**Purpose**: Push GeoJSON visualization data to the client-side map via WebSocket.  
**Source**: Internal (WebSocket push)

```typescript
interface RenderOnMapInput {
  geojson: GeoJSON.FeatureCollection;
  style: {
    type: "marker" | "circle" | "polygon" | "polyline" | "heatmap";
    color: string;
    opacity: number;
    radius?: number;            // For circles
    weight?: number;            // For lines
    fill_color?: string;        // For polygons
    fill_opacity?: number;
    icon?: string;              // For markers: emoji or icon name
  };
  label: string;                // Layer label for legend
  fit_bounds?: boolean;         // Auto-zoom to show this data
  layer_group?: string;         // Group name for toggle control
}

interface RenderOnMapOutput {
  layer_id: string;             // Generated unique layer ID
  feature_count: number;
  rendered: boolean;
  message: string;              // "Rendered 8 drain segments on map"
}
```

---

### Tool 13: `check_infrastructure_delivery`

**Purpose**: Cross-reference government spending records against physical ground truth.  
**Source**: Pre-fetched e-GP/IMED JSON + OSM Overpass

```typescript
interface CheckInfrastructureDeliveryInput {
  lat: number;
  lon: number;
  radius_m: number;
  project_type: string;         // "drain", "road", "clinic", "school", "bridge"
  reported_budget_bdt?: number; // Optional override budget figure
}

interface CheckInfrastructureDeliveryOutput {
  project_type: string;
  public_projects_found: number;
  projects: Array<{
    project_id: string;
    project_name: string;
    budget_bdt: number;
    approved_year: number;
    completion_target: number;
    implementing_agency: string;
    source_url: string;
  }>;
  total_announced_budget_bdt: number;
  osm_evidence_count: number;
  expected_count_from_budget: number;
  delivery_gap_percent: number;
  gap_label: {
    level: "Low" | "Moderate" | "High" | "Very High";
    color: string;              // Hex color
    icon: string;               // Emoji
  };
  source_urls: string[];
  data_confidence: "LOW" | "MODERATE" | "HIGH";
  confidence_note: string;
  disclaimer: string;           // MANDATORY — always included
}
```

**Gap Calculation Logic**:
```javascript
function calculateGap(osmCount, expectedCount, projects) {
  if (expectedCount === 0) return 0;
  const gap = Math.max(0, ((expectedCount - osmCount) / expectedCount) * 100);
  return Math.round(gap);
}

function estimateFromBudget(budgetBDT, type) {
  const unitCosts = {
    drain:  2500000,   // ~BDT 25 lakh per drain segment (500m)
    road:   5000000,   // ~BDT 50 lakh per road segment (500m)
    clinic: 8000000,   // ~BDT 80 lakh per community clinic
    school: 20000000,  // ~BDT 2 crore per primary school
    bridge: 40000000   // ~BDT 4 crore per pedestrian bridge
  };
  return Math.floor(budgetBDT / (unitCosts[type] || 10000000));
}
```

---

## 5. Gemini Agent Integration

### 5.1 Gemini API Configuration

```javascript
// Agent configuration
const agentConfig = {
  model: "gemini-2.5-flash",
  apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  apiKey: process.env.GEMINI_API_KEY,  // Free tier
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 4096,
    topP: 0.95,
  }
};
```

### 5.2 Tool Declaration Format (for Gemini Function Calling)

```json
{
  "tools": [{
    "function_declarations": [
      {
        "name": "geocode",
        "description": "Convert a place name in Dhaka to geographic coordinates (latitude, longitude). Use this when the user mentions a location by name.",
        "parameters": {
          "type": "object",
          "properties": {
            "place_name": {
              "type": "string",
              "description": "The place name to geocode, e.g., 'Mirpur 10, Dhaka'"
            }
          },
          "required": ["place_name"]
        }
      },
      {
        "name": "query_osm_amenities",
        "description": "Search for amenities (hospitals, schools, clinics, pharmacies) within a radius of a location using OpenStreetMap data.",
        "parameters": {
          "type": "object",
          "properties": {
            "lat": { "type": "number", "description": "Latitude" },
            "lon": { "type": "number", "description": "Longitude" },
            "radius_m": { "type": "number", "description": "Search radius in meters" },
            "types": {
              "type": "array",
              "items": { "type": "string" },
              "description": "Amenity types to search: hospital, clinic, school, pharmacy, etc."
            }
          },
          "required": ["lat", "lon", "radius_m", "types"]
        }
      }
    ]
  }]
}
```

> **Full tool declarations** follow the same pattern for all 13 tools. See the Gemini Function Calling docs for format details.

### 5.3 Agentic Loop Logic

```
1. Receive user query via WebSocket
2. Build message array: [system_prompt, ...conversation_history, user_query]
3. Call Gemini API with tool declarations
4. WHILE response contains function_call:
   a. Stream reasoning text to client via WebSocket ("reasoning" message)
   b. Extract function_call name and args
   c. Send "tool_call" message to client
   d. Execute the tool function server-side
   e. Send "tool_result" message to client
   f. Append tool result to message array
   g. Call Gemini API again with updated message array
5. Stream final text response to client ("response" messages)
6. Send "response done" message with metadata
```

### 5.4 System Prompt Structure

The system prompt is stored in `server/prompts/system_prompt.txt` and contains:

1. **Role definition**: Urban planning AI advisor for Dhaka
2. **Tool usage guidelines**: When to call which tools
3. **Accountability protocol**: Rules for using Tool 13
4. **Response format**: How to structure answers, mandatory disclaimers
5. **Safety rules**: What never to do (name individuals, make legal claims, etc.)

---

## 6. Data Models

### 6.1 Pre-loaded Data Files

| File | Schema | Records | Size |
|------|--------|---------|------|
| `data/imed_dhaka_projects.json` | `ProjectRecord[]` | ~50-100 | ~50KB |
| `data/egp_dhaka_contracts.json` | `ProjectRecord[]` | ~30-50 | ~30KB |
| `data/cptu_unit_costs.json` | `UnitCost[]` | ~25 | ~5KB |
| `data/dhaka_thanas.geojson` | `GeoJSON FeatureCollection` | ~50 features | ~500KB |
| `data/urban_standards.json` | `Standard[]` | ~20 | ~10KB |

### 6.2 ProjectRecord Schema

```typescript
interface ProjectRecord {
  project_id: string;
  project_name: string;
  type: "drain" | "road" | "clinic" | "school" | "bridge" | "other";
  thana: string;
  lat: number;
  lon: number;
  budget_bdt: number;
  approved_year: number;
  completion_target: number;
  source_url: string;
  implementing_agency: string;
  status?: "approved" | "ongoing" | "completed" | "unknown";
}
```

### 6.3 UnitCost Schema

```typescript
interface UnitCost {
  type: string;
  description: string;
  unit: string;              // "per 500m segment", "per facility"
  cost_bdt: number;
  cost_year: number;         // When this cost was published
  source: string;            // "CPTU Schedule 2023-24"
}
```

---

## 7. Error Handling

### Error Codes

| Code | HTTP/WS | Description | Recovery |
|------|---------|-------------|----------|
| `RATE_LIMIT` | WS | External API rate limit hit | Wait and retry |
| `GEOCODE_NOT_FOUND` | WS | Place name could not be geocoded | Ask user to clarify |
| `OVERPASS_TIMEOUT` | WS | Overpass API query timed out | Reduce radius, retry |
| `GEMINI_ERROR` | WS | Gemini API returned an error | Retry with backoff |
| `NO_DATA` | WS | No procurement records found for area | Inform user, proceed without |
| `INVALID_INPUT` | WS | Malformed input parameters | Return validation error |
| `SERVER_ERROR` | 500 | Internal server error | Log and alert |

### Error Response Format

```json
{
  "type": "error",
  "code": "OVERPASS_TIMEOUT",
  "message": "The infrastructure query timed out. Try a smaller search radius.",
  "recoverable": true,
  "suggestion": "Retry with radius_m: 1000 instead of 5000"
}
```

---

## 8. Rate Limiting & Caching

### External API Rate Limits

| API | Free Limit | Strategy |
|-----|-----------|----------|
| Gemini 2.5 Flash | 1,500 req/day | Count requests, warn at 80% |
| Nominatim | 1 req/sec | Queue with 1s delay between calls |
| Overpass API | Fair use (~10,000/day) | Cache results for 5 minutes |
| WAQI | 1,000 req/day | Cache AQI for 30 minutes |
| OpenWeatherMap | 1,000 req/day | Cache weather for 15 minutes |

### Caching Strategy

```javascript
// In-memory cache with TTL
const cache = new Map();

function getCached(key, ttlMs) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttlMs) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// TTL per data type
const TTL = {
  geocode:     24 * 60 * 60 * 1000,  // 24 hours (locations don't change)
  osm_query:   5 * 60 * 1000,         // 5 minutes
  air_quality: 30 * 60 * 1000,        // 30 minutes
  weather:     15 * 60 * 1000,        // 15 minutes
  boundary:    Infinity,               // Pre-loaded, never expires
  projects:    Infinity,               // Pre-loaded, never expires
};
```

---

## Environment Variables

```bash
# .env
GEMINI_API_KEY=your_gemini_api_key_here
WAQI_TOKEN=your_waqi_token_here
OWM_API_KEY=your_openweathermap_key_here
PORT=3000
NODE_ENV=development
```

---

*NagorMind API Documentation v2.0 — Complete reference for all external and internal interfaces.*
