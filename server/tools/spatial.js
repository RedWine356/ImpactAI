/**
 * Spatial Tools (1-4): geocode, query_osm_amenities, query_osm_infrastructure, get_boundary
 */
import { getCached, setCache } from '../cache.js';
import { DATA } from '../index.js';

// Rate limiter for Nominatim (1 req/sec)
let lastNominatimCall = 0;
const OVERPASS_ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',   // fastest mirror
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',        // main (often busy)
];
const OVERPASS_TIMEOUT_MS = 45000;

async function nominatimThrottle() {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastNominatimCall));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimCall = Date.now();
}

async function queryOverpass(query) {
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = new Error(`Overpass API error: ${res.status}`);
        err.status = res.status;
        throw err;
      }

      return await res.json();
    } catch (err) {
      lastError = err;
      // Try next endpoint
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('Overpass API unavailable');
}

// ─── Tool 1: geocode ───
export async function geocode({ place_name }) {
  const cacheKey = `geocode:${place_name.toLowerCase().trim()}`;
  const cached = await getCached(cacheKey, 'geocode');
  if (cached) return cached;

  await nominatimThrottle();

  const query = encodeURIComponent(place_name + (place_name.toLowerCase().includes('dhaka') ? '' : ', Dhaka, Bangladesh'));
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&countrycodes=bd&limit=1&addressdetails=1`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'NagorMind/2.0 (nagormind@hackathon.dev)' },
  });

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

  const data = await res.json();

  if (!data.length) {
    return {
      lat: null,
      lon: null,
      display_name: null,
      osm_type: null,
      bounding_box: null,
      confidence: 'LOW',
      error: `Could not geocode "${place_name}"`,
    };
  }

  const r = data[0];
  const result = {
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    display_name: r.display_name,
    osm_type: r.osm_type,
    bounding_box: r.boundingbox ? r.boundingbox.map(Number) : null,
    confidence: r.importance > 0.5 ? 'HIGH' : r.importance > 0.3 ? 'MEDIUM' : 'LOW',
  };

  await setCache(cacheKey, result, 'geocode');
  return result;
}

// ─── Tool 2: query_osm_amenities ───
export async function query_osm_amenities({ lat, lon, radius_m, types }) {
  const cacheKey = `osm_amenities:${lat}:${lon}:${radius_m}:${types.sort().join(',')}`;
  const cached = await getCached(cacheKey, 'osm_query');
  if (cached) return cached;

  const typeFilter = types.join('|');
  const query = `[out:json][timeout:40];
(
  node["amenity"~"${typeFilter}"](around:${radius_m},${lat},${lon});
  way["amenity"~"${typeFilter}"](around:${radius_m},${lat},${lon});
);
out center body;`;

  const data = await queryOverpass(query);
  const elements = data.elements || [];

  const items = elements.map((el) => ({
    osm_id: el.id,
    name: el.tags?.name || null,
    name_bn: el.tags?.['name:bn'] || null,
    type: el.tags?.amenity || 'unknown',
    lat: el.lat || el.center?.lat,
    lon: el.lon || el.center?.lon,
    tags: el.tags || {},
  }));

  const byType = {};
  items.forEach((i) => {
    byType[i.type] = (byType[i.type] || 0) + 1;
  });

  const areaKm2 = (Math.PI * (radius_m / 1000) ** 2);

  // Build GeoJSON for render_on_map (full data)
  const geojson = {
    type: 'FeatureCollection',
    features: items
      .filter((i) => i.lat && i.lon)
      .map((i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [i.lon, i.lat] },
        properties: { name: i.name, type: i.type, name_bn: i.name_bn },
      })),
  };

  const result = {
    total_count: items.length,
    by_type: byType,
    geojson,                                    // full GeoJSON for render_on_map
    sample: items.slice(0, 3).map((i) => ({ name: i.name, type: i.type, lat: i.lat, lon: i.lon })),
    query_area_km2: Math.round(areaKm2 * 100) / 100,
    source: 'Overpass API (OpenStreetMap)',
  };

  await setCache(cacheKey, result, 'osm_query');
  return result;
}

// ─── Tool 3: query_osm_infrastructure ───

const OSM_TYPE_MAP = {
  drain: '"waterway"="drain"',
  drainage: '"man_made"="drainage"',
  road: '"highway"~"primary|secondary|tertiary|residential"',
  bridge: '"bridge"="yes"',
  waterway: '"waterway"~"river|canal|stream"',
  culvert: '"tunnel"="culvert"',
};

export async function query_osm_infrastructure({ lat, lon, radius_m, types }) {
  const cacheKey = `osm_infra:${lat}:${lon}:${radius_m}:${types.sort().join(',')}`;
  const cached = await getCached(cacheKey, 'osm_query');
  if (cached) return cached;

  // Build overpass query for requested types
  const clauses = [];
  for (const t of types) {
    const mappings = [];
    if (t === 'drain') {
      mappings.push('"waterway"="drain"', '"man_made"="drainage"');
    } else if (OSM_TYPE_MAP[t]) {
      mappings.push(OSM_TYPE_MAP[t]);
    }
    for (const m of mappings) {
      clauses.push(`way[${m}](around:${radius_m},${lat},${lon});`);
      clauses.push(`node[${m}](around:${radius_m},${lat},${lon});`);
    }
  }

  const query = `[out:json][timeout:40];
(
  ${clauses.join('\n  ')}
);
out center body;`;

  const data = await queryOverpass(query);
  const elements = data.elements || [];

  let totalLengthKm = 0;
  const items = elements.map((el) => {
    const lengthM = el.tags?.length ? parseFloat(el.tags.length) : null;
    if (lengthM) totalLengthKm += lengthM / 1000;

    let elType = 'unknown';
    if (el.tags?.waterway === 'drain' || el.tags?.man_made === 'drainage') elType = 'drain';
    else if (el.tags?.highway) elType = 'road';
    else if (el.tags?.bridge === 'yes') elType = 'bridge';
    else if (el.tags?.waterway) elType = 'waterway';
    else if (el.tags?.tunnel === 'culvert') elType = 'culvert';

    return {
      osm_id: el.id,
      name: el.tags?.name || null,
      type: elType,
      geometry_type: el.type,
      length_m: lengthM,
      lat: el.lat || el.center?.lat,
      lon: el.lon || el.center?.lon,
      tags: el.tags || {},
    };
  });

  const byType = {};
  items.forEach((i) => {
    byType[i.type] = (byType[i.type] || 0) + 1;
  });

  // Build GeoJSON for render_on_map
  const geojson = {
    type: 'FeatureCollection',
    features: items
      .filter((i) => i.lat && i.lon)
      .map((i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [i.lon, i.lat] },
        properties: { name: i.name, type: i.type },
      })),
  };

  const result = {
    total_count: items.length,
    by_type: byType,
    total_length_km: Math.round(totalLengthKm * 100) / 100,
    geojson,                                    // full GeoJSON for render_on_map
    sample: items.slice(0, 3).map((i) => ({ name: i.name, type: i.type, lat: i.lat, lon: i.lon })),
    source: 'Overpass API (OpenStreetMap)',
  };

  await setCache(cacheKey, result, 'osm_query');
  return result;
}

// ─── Tool 4: get_boundary ───
export async function get_boundary({ area_name }) {
  const searchName = area_name.toLowerCase().replace(/\s*thana\s*/gi, '').trim();

  const feature = DATA.thanas.features.find((f) => {
    const name = f.properties.name.toLowerCase();
    const nameBn = f.properties.name_bn || '';
    return (
      name === searchName ||
      name.includes(searchName) ||
      searchName.includes(name) ||
      nameBn === area_name
    );
  });

  if (!feature) {
    // Fallback: try Nominatim for boundary
    const geo = await geocode({ place_name: area_name });
    if (geo.lat) {
      return {
        name: area_name,
        name_bn: '',
        admin_level: 9,
        zone: 'Unknown',
        geometry: null,
        area_km2: 0,
        centroid: { lat: geo.lat, lon: geo.lon },
        found: false,
        note: 'Boundary polygon not in local data. Centroid from geocoding.',
      };
    }
    return { found: false, name: area_name, error: 'Area not found' };
  }

  const coords = feature.geometry.coordinates[0];
  const lats = coords.map((c) => c[1]);
  const lons = coords.map((c) => c[0]);
  const centroidLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const centroidLon = lons.reduce((a, b) => a + b, 0) / lons.length;

  // Rough area calculation
  const latRange = Math.max(...lats) - Math.min(...lats);
  const lonRange = Math.max(...lons) - Math.min(...lons);
  const areaKm2 = latRange * 111 * lonRange * 111 * Math.cos((centroidLat * Math.PI) / 180);

  return {
    name: feature.properties.name,
    name_bn: feature.properties.name_bn,
    admin_level: feature.properties.admin_level,
    zone: feature.properties.zone,
    geometry: feature.geometry,
    area_km2: Math.round(areaKm2 * 100) / 100,
    centroid: { lat: Math.round(centroidLat * 1000) / 1000, lon: Math.round(centroidLon * 1000) / 1000 },
    found: true,
  };
}
