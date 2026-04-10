/**
 * Tool 13: check_infrastructure_delivery
 * Cross-reference government spending records against OSM ground truth
 */
import { query_osm_infrastructure } from './spatial.js';
import { ALL_PROJECTS } from '../index.js';

const UNIT_COSTS = {
  drain: 2500000,
  road: 5000000,
  clinic: 8000000,
  school: 20000000,
  bridge: 40000000,
};

function estimateFromBudget(budgetBDT, type) {
  const unitCost = UNIT_COSTS[type] || 10000000;
  return Math.floor(budgetBDT / unitCost);
}

function gapLabel(gapPercent) {
  if (gapPercent < 20) return { level: 'Low', color: '#4ade80', icon: '✅' };
  if (gapPercent < 40) return { level: 'Moderate', color: '#facc15', icon: '⚠️' };
  if (gapPercent < 60) return { level: 'High', color: '#fb923c', icon: '🔴' };
  return { level: 'Very High', color: '#ef4444', icon: '🚩' };
}

function lookupPublicProjects(lat, lon, radiusM, projectType) {
  const radiusKm = radiusM / 1000;
  return ALL_PROJECTS.filter((p) => {
    if (p.type !== projectType) return false;
    // Simple distance check using lat/lon difference
    const dLat = Math.abs(p.lat - lat) * 111;
    const dLon = Math.abs(p.lon - lon) * 111 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat ** 2 + dLon ** 2);
    return dist <= radiusKm;
  });
}

// Map project types to OSM query types
const PROJECT_TO_OSM = {
  drain: ['drain'],
  road: ['road'],
  clinic: ['clinic'],  // Won't work for Overpass — handled separately
  school: ['school'],  // Won't work for Overpass — handled separately
  bridge: ['bridge'],
};

export async function check_infrastructure_delivery({
  lat, lon, radius_m, project_type, reported_budget_bdt,
}) {
  // Step 1: Look up public projects
  const publicProjects = lookupPublicProjects(lat, lon, radius_m, project_type);

  // Step 2: Count actual infrastructure via OSM (graceful fallback on error)
  let osmCount = 0;
  let osmNote = null;
  let osmGeojson = null;

  try {
    if (['drain', 'road', 'bridge'].includes(project_type)) {
      const osmTypes = PROJECT_TO_OSM[project_type] || [project_type];
      const osmData = await query_osm_infrastructure({ lat, lon, radius_m, types: osmTypes });
      if (osmData.error) {
        osmNote = `OSM query failed: ${osmData.error}. Gap calculated without physical evidence.`;
      } else {
        osmCount = osmData.total_count;
        osmGeojson = osmData.geojson || null;
      }
    } else {
      const { query_osm_amenities } = await import('./spatial.js');
      const amenityType = project_type === 'clinic' ? ['hospital', 'clinic'] : [project_type];
      const amenityData = await query_osm_amenities({ lat, lon, radius_m, types: amenityType });
      if (amenityData.error) {
        osmNote = `OSM query failed: ${amenityData.error}. Gap calculated without physical evidence.`;
      } else {
        osmCount = amenityData.total_count;
        osmGeojson = amenityData.geojson || null;
      }
    }
  } catch (err) {
    osmNote = `OSM unavailable: ${err.message}. Gap calculated from procurement records only.`;
  }

  // Step 3: Compute expected count
  const totalBudget = reported_budget_bdt ||
    publicProjects.reduce((sum, p) => sum + p.budget_bdt, 0);
  const expectedCount = estimateFromBudget(totalBudget, project_type);

  // Step 4: Calculate gap
  let gapPercent = 0;
  if (expectedCount > 0) {
    gapPercent = Math.max(0, Math.round(((expectedCount - osmCount) / expectedCount) * 100));
  }

  // Data confidence assessment
  let confidence = 'MODERATE';
  let confidenceNote = 'OSM may not capture all recent construction. Gap could reflect mapping incompleteness, project delays, or scope changes.';
  if (publicProjects.length === 0) {
    confidence = 'LOW';
    confidenceNote = 'No public procurement records found in database for this area and type. Analysis limited to OSM data only.';
  } else if (osmCount === 0 && expectedCount > 0) {
    confidence = 'LOW';
    confidenceNote = 'Zero OSM features found — may indicate unmapped infrastructure rather than missing construction.';
  } else if (publicProjects.length >= 3) {
    confidence = 'HIGH';
    confidenceNote = 'Multiple procurement records matched. OSM evidence available for comparison.';
  }

  return {
    project_type,
    public_projects_found: publicProjects.length,
    projects: publicProjects.map((p) => ({
      project_id: p.project_id,
      project_name: p.project_name,
      budget_bdt: p.budget_bdt,
      approved_year: p.approved_year,
      completion_target: p.completion_target,
      implementing_agency: p.implementing_agency,
      source_url: p.source_url,
    })),
    total_announced_budget_bdt: totalBudget,
    osm_evidence_count: osmCount,
    osm_note: osmNote,
    osm_geojson: osmGeojson,
    expected_count_from_budget: expectedCount,
    delivery_gap_percent: gapPercent,
    gap_label: gapLabel(gapPercent),
    source_urls: publicProjects.map((p) => p.source_url),
    data_confidence: confidence,
    confidence_note: confidenceNote,
    disclaimer:
      '⚠️ This is a statistical anomaly flag based on public data only. ' +
      'It does not constitute evidence of wrongdoing. ' +
      'Gaps may reflect OSM incompleteness, project delays, or scope changes. ' +
      'Use as a starting point for investigation only.',
  };
}
