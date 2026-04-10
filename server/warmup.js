/**
 * warmup.js — pre-caches Overpass API results for demo queries
 * Run once before the demo: node server/warmup.js
 */
import 'dotenv/config';
import { initCache } from './cache.js';
import { geocode, query_osm_amenities, query_osm_infrastructure, get_boundary } from './tools/spatial.js';
import { get_air_quality, get_weather } from './tools/environment.js';

await initCache(process.env.REDIS_URL || null);

const DEMO_LOCATIONS = [
  { name: 'Mirpur 10, Dhaka',  lat: 23.808, lon: 90.368 },
  { name: 'Mirpur, Dhaka',     lat: 23.812, lon: 90.364 },
  { name: 'Dhanmondi, Dhaka',  lat: 23.746, lon: 90.374 },
  { name: 'Gulshan, Dhaka',    lat: 23.780, lon: 90.415 },
  { name: 'Mohammadpur, Dhaka', lat: 23.764, lon: 90.358 },
];

async function run(label, fn) {
  process.stdout.write(`  Caching ${label}... `);
  const start = Date.now();
  try {
    const result = await fn();
    const ok = result?.error ? `WARN: ${result.error}` : `OK (${Date.now() - start}ms)`;
    console.log(ok);
  } catch (e) {
    console.log(`ERROR: ${e.message.slice(0, 80)}`);
  }
}

console.log('\n🚀 NagorMind Cache Warmup\n');

for (const loc of DEMO_LOCATIONS) {
  console.log(`📍 ${loc.name}`);

  await run(`geocode`, () => geocode({ place_name: loc.name }));
  await run(`amenities (hospital, clinic)`, () =>
    query_osm_amenities({ lat: loc.lat, lon: loc.lon, radius_m: 2000, types: ['hospital', 'clinic'] }));
  await run(`infrastructure (drain)`, () =>
    query_osm_infrastructure({ lat: loc.lat, lon: loc.lon, radius_m: 2000, types: ['drain'] }));
  await run(`infrastructure (road)`, () =>
    query_osm_infrastructure({ lat: loc.lat, lon: loc.lon, radius_m: 2000, types: ['road'] }));
  await run(`boundary`, () => get_boundary({ area_name: loc.name.split(',')[0] }));
  await run(`air quality`, () => get_air_quality({ lat: loc.lat, lon: loc.lon }));
  await run(`weather`, () => get_weather({ lat: loc.lat, lon: loc.lon }));
  console.log('');
}

console.log('✅ Warmup complete — demo queries are cached.\n');
process.exit(0);
