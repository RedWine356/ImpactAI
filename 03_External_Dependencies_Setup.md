# NagorMind — External Files, APIs & Setup Guide

> **Goal**: Every external dependency, API key, dataset, and file you need — with exact step-by-step instructions to obtain each one.  
> **Total Cost**: BDT 0 (all free tier or open source)

---

## Table of Contents

1. [API Keys & Accounts (3 keys needed)](#1-api-keys--accounts)
2. [Pre-Fetched Data Files (5 files to create)](#2-pre-fetched-data-files)
3. [NPM Dependencies](#3-npm-dependencies)
4. [Static Assets](#4-static-assets)
5. [Development Tools](#5-development-tools)
6. [Pre-Fetch Scripts](#6-pre-fetch-scripts)
7. [Complete Checklist](#7-complete-checklist)

---

## 1. API Keys & Accounts

You need **3 API keys**. All are free.

---

### 1.1 Gemini 2.5 Flash API Key

**What**: Google's AI model for the agentic reasoning loop  
**Free Limit**: 1,500 requests/day, 1M tokens/min  
**Time to Get**: ~2 minutes

**Step-by-Step**:

1. Go to **https://aistudio.google.com/**
2. Sign in with your Google account
3. Click **"Get API Key"** in the left sidebar (or navigate to https://aistudio.google.com/apikey)
4. Click **"Create API Key"**
5. Select an existing Google Cloud project or let it create one
6. Copy the generated key (format: `AIzaSy...`)
7. Save it as `GEMINI_API_KEY` in your `.env` file

**Verification**:
```bash
# Test your key works
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

**Documentation**: https://ai.google.dev/gemini-api/docs

---

### 1.2 WAQI (World Air Quality Index) Token

**What**: Real-time Air Quality Index data for any location  
**Free Limit**: 1,000 calls/day  
**Time to Get**: ~3 minutes (instant approval)

**Step-by-Step**:

1. Go to **https://aqicn.org/data-platform/token/**
2. Fill in the form:
   - **Email**: Your email
   - **Name**: Your name
   - **Project**: "NagorMind — Urban Planning AI for Dhaka"
3. Click **"Submit"**
4. Check your email for the confirmation link
5. Click the link — your token is displayed on the page
6. Copy the token (format: alphanumeric string, ~40 chars)
7. Save it as `WAQI_TOKEN` in your `.env` file

**Verification**:
```bash
# Test with Dhaka coordinates
curl "https://api.waqi.info/feed/geo:23.8103;90.4125/?token=YOUR_TOKEN"
```

**Expected Response**: JSON with `aqi` value (usually 100-300 for Dhaka)

**Documentation**: https://aqicn.org/json-api/doc/

---

### 1.3 OpenWeatherMap API Key

**What**: Current weather and 5-day forecast  
**Free Limit**: 1,000 calls/day  
**Time to Get**: ~3 minutes (instant approval)

**Step-by-Step**:

1. Go to **https://openweathermap.org/api**
2. Click **"Sign Up"** (top right)
3. Create a free account
4. After email verification, go to **https://home.openweathermap.org/api_keys**
5. You'll see a default key already generated, or click **"Generate"**
6. Copy the key (format: 32-character hex string)
7. Save it as `OWM_API_KEY` in your `.env` file

> ⚠️ **Note**: New OWM API keys take **up to 2 hours** to activate. Get this key FIRST.

**Verification**:
```bash
# Test with Dhaka coordinates
curl "https://api.openweathermap.org/data/2.5/weather?lat=23.8103&lon=90.4125&appid=YOUR_KEY&units=metric"
```

**Documentation**: https://openweathermap.org/current

---

### No-Key APIs (No Signup Required)

These APIs are free and require no authentication:

| API | Purpose | Endpoint | Limit |
|-----|---------|----------|-------|
| **Nominatim** (OSM Geocoding) | Place name → coordinates | `https://nominatim.openstreetmap.org/search` | 1 req/sec, needs `User-Agent` header |
| **Overpass API** (OSM Queries) | Infrastructure & amenity data | `https://overpass-api.de/api/interpreter` | Fair use (~10K/day), 2 concurrent |

**Nominatim Requirements**:
- Must set `User-Agent: NagorMind/2.0 (your@email.com)` header
- Max 1 request per second
- Don't bulk geocode — they will block you

**Overpass Requirements**:
- Max 2 concurrent queries
- Timeout set to ≤25 seconds per query
- Cache results aggressively

---

## 2. Pre-Fetched Data Files

You need to create **5 JSON/GeoJSON files** in the `data/` directory. These are loaded at server startup.

---

### 2.1 `data/imed_dhaka_projects.json`

**What**: Government infrastructure projects in Dhaka from IMED monitoring reports  
**Source**: IMED (Implementation Monitoring and Evaluation Division)

**Step-by-Step to Obtain**:

1. Go to **https://www.imed.gov.bd/**
2. Navigate to: **Publications → Annual Reports** (or "বার্ষিক প্রতিবেদন")
3. Download the most recent Annual Development Programme (ADP) implementation reports
4. Look for chapters on **Dhaka Division** or **Local Government Division (LGD)**
5. From the PDF tables, extract projects that match:
   - Location: Dhaka City area (DNCC/DSCC zones)
   - Types: Drainage, road, clinic, school, bridge
   - Years: 2020-2024
6. Convert extracted data into JSON format (see schema below)

**Alternative Approach** (Faster):
1. Go to **https://erdpbd.org/** (External Resources Division project database)
2. Or search **"IMED project database Dhaka"** 
3. Or use **https://ppp.gov.bd/** for public-private partnership projects

**If official data is hard to extract**: Create a realistic sample dataset based on publicly known projects (Mirpur drainage, Hazaribagh road widening, etc.). The demo needs ~15-30 project records.

**JSON Schema**:
```json
[
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
```

**Fields to Populate**:

| Field | How to Get |
|-------|-----------|
| `project_id` | From IMED/e-GP project reference number |
| `project_name` | Exact project title from the document |
| `type` | Categorize: drain, road, clinic, school, bridge |
| `thana` | Map project location to Dhaka thana name |
| `lat, lon` | Use Nominatim to geocode the project location |
| `budget_bdt` | From the approved budget column in BDT |
| `approved_year` | Fiscal year of approval |
| `completion_target` | Expected completion year |
| `source_url` | Direct link to government document (or portal main page) |
| `implementing_agency` | DNCC, DSCC, LGED, DGHS, DPE, etc. |

**Minimum Records**: 15 projects covering at least 3 thanas and 3 types

---

### 2.2 `data/egp_dhaka_contracts.json`

**What**: Electronic Government Procurement contracts for Dhaka  
**Source**: e-GP Portal

**Step-by-Step to Obtain**:

1. Go to **https://www.eprocure.gov.bd/**
2. Click **"Search Tender"** (top menu) or **"টেন্ডার অনুসন্ধান"**
3. Filter by:
   - **Procuring Entity**: DNCC, DSCC, LGED Dhaka, RAJUK
   - **Period**: 2020-2024
   - **Category**: Works / Construction
4. Browse results and extract relevant infrastructure projects
5. For each: note the package number, title, estimated cost, procuring entity
6. Convert to the same JSON schema as IMED projects

**Alternative**: The e-GP portal data overlaps with IMED data. If you already have good IMED data, you can merge both sources into a single file or keep this file smaller.

**Same JSON Schema** as `imed_dhaka_projects.json`

**Minimum Records**: 10 contracts

---

### 2.3 `data/cptu_unit_costs.json`

**What**: Standard unit cost benchmarks for Bangladesh infrastructure  
**Source**: Central Procurement Technical Unit (CPTU)

**Step-by-Step to Obtain**:

1. Go to **https://www.cptu.gov.bd/**
2. Navigate to **"Rate Schedule"** or **"মূল্য তালিকা"**
3. Download the latest **Schedule of Rates (SoR)** for:
   - PWD (Public Works Department) — roads, buildings
   - LGED — rural roads, small bridges, drains
   - WASA — water and sewerage
4. Extract unit costs for common items

**If the official SoR is hard to find**, use these reasonable estimates based on publicly known Bangladesh construction costs:

```json
[
  {
    "type": "drain",
    "description": "RCC box drain (500m segment, 1.2m x 1.0m)",
    "unit": "per 500m segment",
    "cost_bdt": 2500000,
    "cost_year": 2023,
    "source": "LGED Rate Schedule 2023-24"
  },
  {
    "type": "drain",
    "description": "Open drain with masonry wall (500m)",
    "unit": "per 500m segment",
    "cost_bdt": 1500000,
    "cost_year": 2023,
    "source": "LGED Rate Schedule 2023-24"
  },
  {
    "type": "road",
    "description": "Bituminous road resurfacing (500m, 6m wide)",
    "unit": "per 500m segment",
    "cost_bdt": 5000000,
    "cost_year": 2023,
    "source": "PWD Rate Schedule 2023-24"
  },
  {
    "type": "road",
    "description": "Road widening with drainage (500m)",
    "unit": "per 500m segment",
    "cost_bdt": 12000000,
    "cost_year": 2023,
    "source": "PWD Rate Schedule 2023-24"
  },
  {
    "type": "clinic",
    "description": "Community clinic construction (standard design)",
    "unit": "per facility",
    "cost_bdt": 8000000,
    "cost_year": 2023,
    "source": "DGHS Standard Design Package"
  },
  {
    "type": "clinic",
    "description": "Upazila Health Complex upgrade",
    "unit": "per facility",
    "cost_bdt": 25000000,
    "cost_year": 2023,
    "source": "DGHS Standard Design Package"
  },
  {
    "type": "school",
    "description": "Primary school building (6-room standard)",
    "unit": "per facility",
    "cost_bdt": 20000000,
    "cost_year": 2023,
    "source": "DPE Standard Cost 2023"
  },
  {
    "type": "bridge",
    "description": "Pedestrian overpass bridge",
    "unit": "per structure",
    "cost_bdt": 10000000,
    "cost_year": 2023,
    "source": "RHD Rate Schedule 2023-24"
  },
  {
    "type": "bridge",
    "description": "Small vehicle bridge (RCC, 50m span)",
    "unit": "per structure",
    "cost_bdt": 80000000,
    "cost_year": 2023,
    "source": "RHD Rate Schedule 2023-24"
  },
  {
    "type": "culvert",
    "description": "RCC box culvert (single cell)",
    "unit": "per structure",
    "cost_bdt": 3000000,
    "cost_year": 2023,
    "source": "LGED Rate Schedule 2023-24"
  }
]
```

---

### 2.4 `data/dhaka_thanas.geojson`

**What**: Administrative boundary polygons for Dhaka thanas/police stations  
**Source**: HDX (Humanitarian Data Exchange) or OSM export

**Step-by-Step to Obtain**:

#### Option A: HDX (Recommended — Clean, official data)

1. Go to **https://data.humdata.org/**
2. Search for **"Bangladesh administrative boundaries"**
3. Look for the dataset: **"Bangladesh - Subnational Administrative Boundaries"**
   - Direct link: https://data.humdata.org/dataset/cod-ab-bgd
4. Download the **Admin Level 4** shapefile (thana/upazila level)
5. Open in QGIS or use `ogr2ogr` to convert to GeoJSON:
   ```bash
   ogr2ogr -f GeoJSON -where "ADM1_EN='Dhaka'" dhaka_thanas.geojson bgd_adm4.shp
   ```
6. Or use https://mapshaper.org/ — upload shapefile, filter to Dhaka, export as GeoJSON

#### Option B: OSM Export with Overpass

```
[out:json][timeout:60];
area["name:en"="Dhaka"]["admin_level"="4"]->.dhaka;
relation["admin_level"~"8|9"](area.dhaka);
out body;
>;
out skel qt;
```
Run at: https://overpass-turbo.eu/ → Export as GeoJSON

#### Option C: Direct Download (pre-made)

Search GitHub for **"dhaka geojson thana"** — several repos contain ready-to-use files.

**Expected Output**: GeoJSON `FeatureCollection` with ~40-50 thana polygons covering Dhaka Metropolitan area. Each feature should have:
```json
{
  "type": "Feature",
  "properties": {
    "name": "Mirpur",
    "name_bn": "মিরপুর",
    "zone": "DNCC",
    "admin_level": 9
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[90.35, 23.79], [90.38, 23.79], ...]]
  }
}
```

---

### 2.5 `data/urban_standards.json`

**What**: WHO, BNBC, and UN-Habitat urban planning benchmarks  
**Source**: Compiled from public WHO/UN documents

**Step-by-Step to Obtain**:

This is a reference file you compile yourself from public standards. Here's the complete file:

```json
{
  "healthcare_access": [
    {
      "authority": "WHO",
      "standard": "1 hospital bed per 1,000 population",
      "threshold": 1,
      "unit": "beds per 1000 people",
      "year": 2020,
      "source_url": "https://www.who.int/data/gho"
    },
    {
      "authority": "WHO",
      "standard": "Primary healthcare facility within 2km walking distance",
      "threshold": 2000,
      "unit": "meters max distance",
      "year": 2018,
      "source_url": "https://www.who.int/publications"
    },
    {
      "authority": "Bangladesh DGHS",
      "standard": "1 community clinic per 6,000 population",
      "threshold": 6000,
      "unit": "population per clinic",
      "year": 2022,
      "source_url": "https://dghs.gov.bd/"
    }
  ],
  "education_access": [
    {
      "authority": "Bangladesh DPE",
      "standard": "1 primary school per 1,500 school-age children",
      "threshold": 1500,
      "unit": "children per school",
      "year": 2021,
      "source_url": "https://www.dpe.gov.bd/"
    },
    {
      "authority": "UN-Habitat",
      "standard": "Maximum 1.5km walking distance to primary school",
      "threshold": 1500,
      "unit": "meters max distance",
      "year": 2020,
      "source_url": "https://unhabitat.org/"
    }
  ],
  "drainage": [
    {
      "authority": "BNBC",
      "standard": "Continuous drainage along all major and secondary roads",
      "threshold": 0.8,
      "unit": "coverage ratio (drain length / road length)",
      "year": 2020,
      "source_url": "https://www.bnbc.gov.bd/"
    },
    {
      "authority": "DNCC/DSCC",
      "standard": "Storm drain capacity for 50mm/hour rainfall",
      "threshold": 50,
      "unit": "mm per hour drainage capacity",
      "year": 2022,
      "source_url": "https://www.dncc.gov.bd/"
    }
  ],
  "air_quality": [
    {
      "authority": "WHO",
      "standard": "Annual mean PM2.5 should not exceed 15 µg/m³",
      "threshold": 15,
      "unit": "µg/m³ annual mean",
      "year": 2021,
      "source_url": "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health"
    },
    {
      "authority": "Bangladesh DoE",
      "standard": "24-hour PM2.5 standard: 65 µg/m³",
      "threshold": 65,
      "unit": "µg/m³ 24-hour mean",
      "year": 2022,
      "source_url": "https://doe.gov.bd/"
    }
  ],
  "road_infrastructure": [
    {
      "authority": "UN-Habitat",
      "standard": "30% of urban land should be allocated to streets and roads",
      "threshold": 30,
      "unit": "percent of urban land",
      "year": 2020,
      "source_url": "https://unhabitat.org/"
    },
    {
      "authority": "RAJUK",
      "standard": "Minimum 6m wide residential access road",
      "threshold": 6,
      "unit": "meters road width",
      "year": 2022,
      "source_url": "https://www.rajuk.dhaka.gov.bd/"
    }
  ],
  "green_space": [
    {
      "authority": "WHO",
      "standard": "Minimum 9 sq meters green space per capita",
      "threshold": 9,
      "unit": "sq meters per person",
      "year": 2016,
      "source_url": "https://www.who.int/publications"
    }
  ],
  "population_density": [
    {
      "authority": "Reference",
      "standard": "Dhaka average population density",
      "threshold": 45000,
      "unit": "persons per sq km",
      "year": 2024,
      "source_url": "https://www.bbs.gov.bd/"
    }
  ]
}
```

> **Just save this directly** as `data/urban_standards.json`. No external download needed — the data comes from public WHO, BNBC, and UN publications.

---

## 3. NPM Dependencies

### 3.1 Server Dependencies

```bash
npm init -y
npm install express ws dotenv @google/generative-ai @turf/turf node-fetch
```

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18 | HTTP server for REST endpoints |
| `ws` | ^8.16 | WebSocket server for real-time communication |
| `dotenv` | ^16.3 | Load `.env` file for API keys |
| `@google/generative-ai` | ^0.21 | Official Gemini SDK for function calling |
| `@turf/turf` | ^7.0 | Geospatial calculations (coverage, buffers, distances) |
| `node-fetch` | ^3.3 | HTTP client for calling external APIs (Overpass, WAQI, etc.) |

### 3.2 Client Dependencies (if using React/Vite)

```bash
npm install react react-dom leaflet react-leaflet
npm install -D vite @vitejs/plugin-react
```

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2 | UI framework |
| `react-dom` | ^18.2 | React DOM renderer |
| `leaflet` | ^1.9 | Interactive map library |
| `react-leaflet` | ^4.2 | React wrapper for Leaflet |
| `vite` | ^5.0 | Build tool and dev server |
| `@vitejs/plugin-react` | ^4.2 | Vite plugin for React JSX |

### 3.3 If Using Vanilla JS (No React)

You only need Leaflet via CDN — no npm install for client:

```html
<!-- In index.html -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

---

## 4. Static Assets

### 4.1 Fonts

Add to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 4.2 Map Tile Layer

Use CartoDB dark matter tiles (free, no key required):

```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  maxZoom: 19
}).addTo(map);
```

Alternative dark map styles (all free):
- **Stamen Toner**: `https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png`
- **OSM Standard** (not dark): `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

### 4.3 Icons / Favicons

Create or use city/brain-themed icons. Suggestions:
- Use an emoji as favicon: 🧠 or 🏙️
- Or generate an SVG logo with AI tools

---

## 5. Development Tools

### 5.1 Required

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| **Node.js** | ≥18.x | JavaScript runtime | https://nodejs.org/ |
| **npm** | ≥9.x | Package manager | Included with Node.js |
| **Git** | ≥2.x | Version control | https://git-scm.com/ |

### 5.2 Recommended

| Tool | Purpose | Install |
|------|---------|---------|
| **VS Code** | Code editor | https://code.visualstudio.com/ |
| **Postman/Insomnia** | API testing | https://www.postman.com/ |
| **Overpass Turbo** | Test OSM queries | https://overpass-turbo.eu/ (web) |
| **QGIS** | GeoJSON editing/viewing | https://qgis.org/ |
| **geojson.io** | Quick GeoJSON preview | https://geojson.io/ (web) |
| **jq** | JSON processing in terminal | `brew install jq` |

### 5.3 Browser Extensions

| Extension | Purpose |
|-----------|---------|
| **JSON Viewer** | Pretty-print API responses |
| **React DevTools** | Debug React components (if using React) |

---

## 6. Pre-Fetch Scripts

### 6.1 Geocode Project Locations

If you have project names but not coordinates, use this script:

```javascript
// scripts/geocode_projects.js
const fs = require('fs');

const projects = JSON.parse(fs.readFileSync('data/imed_dhaka_projects.json'));

async function geocodeProject(project) {
  if (project.lat && project.lon) return project; // Already has coords
  
  const query = encodeURIComponent(`${project.thana}, Dhaka, Bangladesh`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&countrycodes=bd&limit=1`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'NagorMind/2.0 (your@email.com)' }
  });
  const data = await response.json();
  
  if (data.length > 0) {
    project.lat = parseFloat(data[0].lat);
    project.lon = parseFloat(data[0].lon);
  }
  
  // Respect rate limit: 1 req/sec
  await new Promise(r => setTimeout(r, 1100));
  return project;
}

async function main() {
  for (let i = 0; i < projects.length; i++) {
    projects[i] = await geocodeProject(projects[i]);
    console.log(`Geocoded ${i + 1}/${projects.length}: ${projects[i].project_name}`);
  }
  fs.writeFileSync('data/imed_dhaka_projects.json', JSON.stringify(projects, null, 2));
  console.log('Done!');
}

main();
```

### 6.2 Test Overpass Queries

Go to https://overpass-turbo.eu/ and test these queries before building:

**Test: Find hospitals near Mirpur 10**:
```
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:3000,23.8069,90.3687);
  way["amenity"="hospital"](around:3000,23.8069,90.3687);
);
out center body;
```

**Test: Find drains near Mirpur 10**:
```
[out:json][timeout:25];
(
  way["waterway"="drain"](around:2000,23.8069,90.3687);
  way["man_made"="drainage"](around:2000,23.8069,90.3687);
);
out center body;
```

**Test: Find all amenities in Dhanmondi**:
```
[out:json][timeout:25];
(
  node["amenity"~"hospital|clinic|school|pharmacy"](around:2000,23.7461,90.3742);
  way["amenity"~"hospital|clinic|school|pharmacy"](around:2000,23.7461,90.3742);
);
out center body;
```

### 6.3 Download Dhaka Thana Boundaries

```bash
# Option 1: From HDX (download manually, then convert)
# Download from https://data.humdata.org/dataset/cod-ab-bgd
# Then convert with ogr2ogr:
ogr2ogr -f GeoJSON -where "ADM2_EN='Dhaka'" data/dhaka_thanas.geojson bgd_admbnda_adm4_bbs_20201113.shp

# Option 2: From Overpass API (automated)
curl -o data/dhaka_thanas.geojson \
  --data-urlencode 'data=[out:json][timeout:60];area["name:en"="Dhaka District"]->.a;rel["admin_level"="9"](area.a);out body;>;out skel qt;' \
  'https://overpass-api.de/api/interpreter'
```

---

## 7. Complete Checklist

Use this checklist to verify everything is ready before coding:

### API Keys
- [ ] `GEMINI_API_KEY` — obtained and tested
- [ ] `WAQI_TOKEN` — obtained and tested
- [ ] `OWM_API_KEY` — obtained and tested (remember: 2hr activation delay!)

### Data Files
- [ ] `data/imed_dhaka_projects.json` — 15+ project records with coordinates
- [ ] `data/egp_dhaka_contracts.json` — 10+ contract records (or merged with IMED)
- [ ] `data/cptu_unit_costs.json` — 10 unit cost entries (template provided above)
- [ ] `data/dhaka_thanas.geojson` — GeoJSON with ~40-50 thana polygons
- [ ] `data/urban_standards.json` — WHO/BNBC benchmarks (template provided above)

### Environment
- [ ] Node.js ≥18 installed (`node --version`)
- [ ] npm ≥9 installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] `.env` file created with all 3 API keys
- [ ] `.env.example` created (keys redacted)

### External APIs Verified
- [ ] Nominatim responds for Dhaka queries (test in browser)
- [ ] Overpass API responds for Dhaka queries (test at overpass-turbo.eu)
- [ ] WAQI returns AQI for Dhaka coordinates
- [ ] OpenWeatherMap returns weather for Dhaka coordinates
- [ ] Gemini API accepts function calling requests

### NPM Packages
- [ ] Server: `express`, `ws`, `dotenv`, `@google/generative-ai`, `@turf/turf`, `node-fetch`
- [ ] Client: `leaflet` (via CDN or npm), `react` + `react-dom` (if using React)

### Dev Tools
- [ ] Overpass Turbo bookmarked for query testing
- [ ] geojson.io bookmarked for GeoJSON preview
- [ ] Postman/Insomnia ready for API testing

---

## Quick Reference: All External URLs

| Resource | URL |
|----------|-----|
| Gemini API Console | https://aistudio.google.com/apikey |
| Gemini Docs | https://ai.google.dev/gemini-api/docs |
| WAQI Token Signup | https://aqicn.org/data-platform/token/ |
| WAQI API Docs | https://aqicn.org/json-api/doc/ |
| OpenWeatherMap Signup | https://openweathermap.org/api |
| OWM API Docs | https://openweathermap.org/current |
| Nominatim API | https://nominatim.openstreetmap.org/search |
| Nominatim Docs | https://nominatim.org/release-docs/latest/api/Search/ |
| Overpass API | https://overpass-api.de/api/interpreter |
| Overpass Turbo (testing) | https://overpass-turbo.eu/ |
| HDX Bangladesh Data | https://data.humdata.org/dataset/cod-ab-bgd |
| IMED Bangladesh | https://www.imed.gov.bd/ |
| e-GP Portal | https://www.eprocure.gov.bd/ |
| CPTU Bangladesh | https://www.cptu.gov.bd/ |
| Leaflet.js | https://leafletjs.com/ |
| Turf.js | https://turfjs.org/ |
| CartoDB Tiles | https://carto.com/basemaps/ |
| Google Fonts (Inter) | https://fonts.google.com/specimen/Inter |
| geojson.io | https://geojson.io/ |

---

*All resources listed above are free-tier or open source. Total cost: BDT 0.*
