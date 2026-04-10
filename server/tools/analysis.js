/**
 * Analysis Tools (7-11): compute_service_coverage, estimate_flood_risk,
 * compare_locations, estimate_intervention_cost, search_urban_standards
 */
import * as turf from '@turf/turf';
import { query_osm_amenities, query_osm_infrastructure, geocode } from './spatial.js';
import { get_air_quality, get_weather } from './environment.js';
import { DATA } from '../index.js';

const COVERAGE_DEFAULTS = {
  hospital: 5000,
  clinic: 2000,
  school: 1500,
  pharmacy: 1000,
};

const POPULATION_DENSITY = 45000; // per km²

// ─── Tool 7: compute_service_coverage ───
export async function compute_service_coverage({
  lat, lon, radius_m, service_type, coverage_radius_m,
}) {
  const coverageR = coverage_radius_m || COVERAGE_DEFAULTS[service_type] || 2000;

  // Fetch amenities
  const amenities = await query_osm_amenities({
    lat, lon, radius_m, types: [service_type],
  });

  const areaKm2 = Math.PI * (radius_m / 1000) ** 2;
  const populationEstimate = Math.round(areaKm2 * POPULATION_DENSITY);

  // Compute coverage using Turf.js
  const searchArea = turf.circle([lon, lat], radius_m / 1000, { units: 'kilometers' });

  let coveredArea = null;
  const facilityPoints = [];

  for (const item of amenities.items) {
    if (!item.lat || !item.lon) continue;
    facilityPoints.push([item.lon, item.lat]);
    const coverageCircle = turf.circle([item.lon, item.lat], coverageR / 1000, { units: 'kilometers' });
    try {
      coveredArea = coveredArea
        ? turf.union(turf.featureCollection([coveredArea, coverageCircle]))
        : coverageCircle;
    } catch {
      // Union can fail with complex geometries, continue
    }
  }

  let coveragePercent = 0;
  let gapZones = turf.featureCollection([]);

  if (coveredArea) {
    try {
      const intersection = turf.intersect(turf.featureCollection([searchArea, coveredArea]));
      if (intersection) {
        const coveredKm2 = turf.area(intersection) / 1_000_000;
        coveragePercent = Math.min(100, Math.round((coveredKm2 / areaKm2) * 100));
      }
    } catch {
      // Fallback: estimate from count
      const maxCoverageKm2 = amenities.total_count * Math.PI * (coverageR / 1000) ** 2;
      coveragePercent = Math.min(100, Math.round((maxCoverageKm2 / areaKm2) * 100));
    }

    try {
      const gap = turf.difference(turf.featureCollection([searchArea, coveredArea]));
      if (gap) {
        gapZones = turf.featureCollection([gap]);
      }
    } catch {
      // Gap computation failed
    }
  }

  // Find recommended locations for new facilities
  const recommended = [];
  if (coveragePercent < 80) {
    // Simple grid-based recommendation
    const bbox = turf.bbox(searchArea);
    const grid = turf.pointGrid(bbox, coverageR / 1000, { units: 'kilometers' });

    for (const pt of grid.features.slice(0, 20)) {
      const [pLon, pLat] = pt.geometry.coordinates;
      const inArea = turf.booleanPointInPolygon(pt, searchArea);
      if (!inArea) continue;

      const minDist = facilityPoints.reduce((min, fp) => {
        const d = turf.distance([pLon, pLat], fp, { units: 'kilometers' });
        return Math.min(min, d);
      }, Infinity);

      if (minDist > coverageR / 1000) {
        recommended.push({
          lat: Math.round(pLat * 10000) / 10000,
          lon: Math.round(pLon * 10000) / 10000,
          reason: `${Math.round(minDist * 1000)}m from nearest ${service_type}`,
        });
      }
      if (recommended.length >= 3) break;
    }
  }

  // Find benchmark
  const standardKey = service_type === 'hospital' || service_type === 'clinic' ? 'healthcare_access' : 'education_access';
  const benchmarks = DATA.standards[standardKey] || [];
  const benchmark = benchmarks[0]?.standard || 'No standard found';

  return {
    area_analyzed_km2: Math.round(areaKm2 * 100) / 100,
    service_count: amenities.total_count,
    population_estimate: populationEstimate,
    coverage_percent: coveragePercent,
    gap_zones: gapZones,
    recommended_new_locations: recommended,
    benchmark,
    meets_benchmark: coveragePercent >= 80,
    source: 'Turf.js spatial analysis on OSM data',
  };
}

// ─── Tool 8: estimate_flood_risk ───
export async function estimate_flood_risk({ lat, lon, radius_m }) {
  // Fetch drains, roads, waterways, and weather in parallel
  const [drainData, roadData, waterwayData, weatherData] = await Promise.all([
    query_osm_infrastructure({ lat, lon, radius_m, types: ['drain'] }),
    query_osm_infrastructure({ lat, lon, radius_m, types: ['road'] }),
    query_osm_infrastructure({ lat, lon, radius_m, types: ['waterway'] }),
    get_weather({ lat, lon }).catch(() => null),
  ]);

  const areaKm2 = Math.PI * (radius_m / 1000) ** 2;

  // Factors
  const drainDensity = areaKm2 > 0 ? drainData.total_count / areaKm2 : 0;
  const roadDensity = areaKm2 > 0 ? roadData.total_count / areaKm2 : 0;
  const drainCoverage = roadData.total_count > 0
    ? Math.min(1, drainData.total_count / roadData.total_count)
    : 0;

  // Waterway proximity — find closest waterway
  let minWaterwayDist = 99999;
  for (const w of waterwayData.items) {
    if (w.lat && w.lon) {
      const dist = turf.distance([lon, lat], [w.lon, w.lat], { units: 'meters' });
      if (dist < minWaterwayDist) minWaterwayDist = dist;
    }
  }

  const recentRain = weatherData?.flood_relevance?.recent_rain_mm || 0;

  // Scoring
  const drainScore = (1 - Math.min(1, drainCoverage)) * 40;
  const rainfallScore = Math.min(1, recentRain / 100) * 20;
  const waterwayScore = (1 - Math.min(1, minWaterwayDist / 2000)) * 20;
  const imperviousScore = Math.min(1, roadDensity / 50) * 20;

  const totalScore = Math.round(Math.min(100, drainScore + rainfallScore + waterwayScore + imperviousScore));

  let riskLabel = 'Low';
  if (totalScore >= 70) riskLabel = 'Very High';
  else if (totalScore >= 50) riskLabel = 'High';
  else if (totalScore >= 30) riskLabel = 'Moderate';

  // Find vulnerable spots (roads without nearby drains)
  const vulnerableSpots = [];
  for (const road of roadData.items.slice(0, 20)) {
    if (!road.lat || !road.lon) continue;
    let nearestDrain = Infinity;
    for (const drain of drainData.items) {
      if (!drain.lat || !drain.lon) continue;
      const d = turf.distance([road.lon, road.lat], [drain.lon, drain.lat], { units: 'meters' });
      if (d < nearestDrain) nearestDrain = d;
    }
    if (nearestDrain > 500) {
      vulnerableSpots.push({
        lat: road.lat,
        lon: road.lon,
        reason: `No drain within ${Math.round(nearestDrain)}m of road segment`,
      });
    }
    if (vulnerableSpots.length >= 5) break;
  }

  const recommendations = [];
  if (drainCoverage < 0.5) recommendations.push('Increase drain coverage — currently below 50% of road network');
  if (minWaterwayDist < 500) recommendations.push('Area is close to waterway — ensure embankment maintenance');
  if (recentRain > 50) recommendations.push('Heavy recent rainfall — monitor for waterlogging');
  if (vulnerableSpots.length > 0) recommendations.push(`${vulnerableSpots.length} road segments lack nearby drainage`);

  return {
    flood_risk_score: totalScore,
    risk_label: riskLabel,
    factors: {
      drain_density_per_km: Math.round(drainDensity * 100) / 100,
      drain_coverage_ratio: Math.round(drainCoverage * 100) / 100,
      recent_rainfall_mm: recentRain,
      waterway_proximity_m: Math.round(minWaterwayDist),
      road_density_per_km2: Math.round(roadDensity * 100) / 100,
    },
    vulnerable_spots: vulnerableSpots,
    recommendations,
    source: 'Composite analysis (OSM + OpenWeatherMap)',
  };
}

// ─── Tool 9: compare_locations ───
export async function compare_locations({ location_a, location_b, metrics }) {
  // Geocode both locations
  const [geoA, geoB] = await Promise.all([
    geocode({ place_name: location_a }),
    geocode({ place_name: location_b }),
  ]);

  if (!geoA.lat || !geoB.lat) {
    return { error: 'Could not geocode one or both locations' };
  }

  const radius = 2000; // 2km radius for comparison
  const metricsA = {};
  const metricsB = {};
  const betterArea = {};

  // Gather metrics in parallel for both locations
  const tasks = [];

  for (const metric of metrics) {
    if (metric === 'healthcare') {
      tasks.push(
        Promise.all([
          query_osm_amenities({ lat: geoA.lat, lon: geoA.lon, radius_m: radius, types: ['hospital', 'clinic'] }),
          query_osm_amenities({ lat: geoB.lat, lon: geoB.lon, radius_m: radius, types: ['hospital', 'clinic'] }),
        ]).then(([a, b]) => {
          metricsA.healthcare = { total: a.total_count, by_type: a.by_type };
          metricsB.healthcare = { total: b.total_count, by_type: b.by_type };
          betterArea.healthcare = a.total_count >= b.total_count ? location_a : location_b;
        })
      );
    }
    if (metric === 'education') {
      tasks.push(
        Promise.all([
          query_osm_amenities({ lat: geoA.lat, lon: geoA.lon, radius_m: radius, types: ['school'] }),
          query_osm_amenities({ lat: geoB.lat, lon: geoB.lon, radius_m: radius, types: ['school'] }),
        ]).then(([a, b]) => {
          metricsA.education = { schools: a.total_count };
          metricsB.education = { schools: b.total_count };
          betterArea.education = a.total_count >= b.total_count ? location_a : location_b;
        })
      );
    }
    if (metric === 'air_quality') {
      tasks.push(
        Promise.all([
          get_air_quality({ lat: geoA.lat, lon: geoA.lon }),
          get_air_quality({ lat: geoB.lat, lon: geoB.lon }),
        ]).then(([a, b]) => {
          metricsA.air_quality = { aqi: a.aqi, label: a.aqi_label };
          metricsB.air_quality = { aqi: b.aqi, label: b.aqi_label };
          betterArea.air_quality = (a.aqi || 999) <= (b.aqi || 999) ? location_a : location_b;
        })
      );
    }
    if (metric === 'flood_risk') {
      tasks.push(
        Promise.all([
          estimate_flood_risk({ lat: geoA.lat, lon: geoA.lon, radius_m: radius }),
          estimate_flood_risk({ lat: geoB.lat, lon: geoB.lon, radius_m: radius }),
        ]).then(([a, b]) => {
          metricsA.flood_risk = { score: a.flood_risk_score, label: a.risk_label };
          metricsB.flood_risk = { score: b.flood_risk_score, label: b.risk_label };
          betterArea.flood_risk = a.flood_risk_score <= b.flood_risk_score ? location_a : location_b;
        })
      );
    }
    if (metric === 'infrastructure') {
      tasks.push(
        Promise.all([
          query_osm_infrastructure({ lat: geoA.lat, lon: geoA.lon, radius_m: radius, types: ['road', 'drain', 'bridge'] }),
          query_osm_infrastructure({ lat: geoB.lat, lon: geoB.lon, radius_m: radius, types: ['road', 'drain', 'bridge'] }),
        ]).then(([a, b]) => {
          metricsA.infrastructure = { total: a.total_count, by_type: a.by_type };
          metricsB.infrastructure = { total: b.total_count, by_type: b.by_type };
          betterArea.infrastructure = a.total_count >= b.total_count ? location_a : location_b;
        })
      );
    }
  }

  await Promise.all(tasks);

  return {
    location_a: { name: location_a, lat: geoA.lat, lon: geoA.lon, metrics: metricsA },
    location_b: { name: location_b, lat: geoB.lat, lon: geoB.lon, metrics: metricsB },
    comparison_summary: `Comparison of ${location_a} vs ${location_b} across ${metrics.length} metrics.`,
    better_area: betterArea,
  };
}

// ─── Tool 10: estimate_intervention_cost ───
export async function estimate_intervention_cost({ intervention_type, scale, location_context }) {
  const costs = DATA.unitCosts.filter((c) => c.type === intervention_type);

  if (!costs.length) {
    return { error: `No cost data for type "${intervention_type}"` };
  }

  const scaleMultiplier = { small: 1, medium: 2, large: 4 };
  const multiplier = scaleMultiplier[scale] || 1;

  const timelineBase = { drain: 6, road: 8, clinic: 12, school: 18, bridge: 24, culvert: 4 };
  const timeline = (timelineBase[intervention_type] || 12) * (multiplier > 2 ? 1.5 : 1);

  const breakdown = costs.map((c) => ({
    item: c.description,
    unit: c.unit,
    quantity: multiplier,
    unit_cost_bdt: c.cost_bdt,
    subtotal_bdt: c.cost_bdt * multiplier,
  }));

  const totalBDT = breakdown.reduce((s, b) => s + b.subtotal_bdt, 0);
  const BDT_TO_USD = 110;

  return {
    intervention_type,
    scale,
    location_context: location_context || null,
    estimated_cost_bdt: totalBDT,
    estimated_cost_usd: Math.round(totalBDT / BDT_TO_USD),
    cost_breakdown: breakdown,
    timeline_months: Math.round(timeline),
    reference: 'CPTU Standard Cost Schedule 2023-24',
    disclaimer: 'Estimates based on government unit cost standards. Actual costs may vary.',
  };
}

// ─── Tool 11: search_urban_standards ───
export async function search_urban_standards({ metric }) {
  const metricMap = {
    healthcare_access: 'healthcare_access',
    healthcare: 'healthcare_access',
    education_access: 'education_access',
    education: 'education_access',
    drainage: 'drainage',
    air_quality: 'air_quality',
    road_density: 'road_infrastructure',
    road_infrastructure: 'road_infrastructure',
    green_space: 'green_space',
    population_density: 'population_density',
  };

  const key = metricMap[metric] || metric;
  const standards = DATA.standards[key];

  if (!standards) {
    return {
      metric,
      standards: [],
      dhaka_current: 'No data available',
      gap_assessment: 'Unable to assess — metric not found in standards database',
    };
  }

  const dhakaStatus = {
    healthcare_access: 'Dhaka has ~0.3 hospital beds per 1,000 people — significantly below WHO standard',
    education_access: 'Average 2.1km to nearest primary school in many underserved areas',
    drainage: 'Estimated 30-40% drain coverage along major roads in older parts of Dhaka',
    air_quality: 'Dhaka annual PM2.5 typically 70-80 µg/m³ — 5x WHO guideline',
    road_infrastructure: 'Only ~8% of Dhaka land allocated to roads (vs 30% UN-Habitat standard)',
    green_space: 'Dhaka has ~1.2 sq m green space per capita (vs 9 sq m WHO standard)',
    population_density: 'Dhaka averages ~45,000 per sq km, among world\'s densest cities',
  };

  return {
    metric: key,
    standards,
    dhaka_current: dhakaStatus[key] || 'Data not available',
    gap_assessment: `See standards above for comparison with Dhaka's current state.`,
  };
}
