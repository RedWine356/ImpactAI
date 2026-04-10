/**
 * Tool Registry — maps tool names to functions and LLM function declarations
 */
import { geocode, query_osm_amenities, query_osm_infrastructure, get_boundary } from './spatial.js';
import { get_air_quality, get_weather } from './environment.js';
import {
  compute_service_coverage,
  estimate_flood_risk,
  compare_locations,
  estimate_intervention_cost,
  search_urban_standards,
} from './analysis.js';
import { render_on_map } from './render.js';
import { check_infrastructure_delivery } from './accountability.js';

// Tool execution map
export const TOOLS = {
  geocode,
  query_osm_amenities,
  query_osm_infrastructure,
  get_boundary,
  get_air_quality,
  get_weather,
  compute_service_coverage,
  estimate_flood_risk,
  compare_locations,
  estimate_intervention_cost,
  search_urban_standards,
  render_on_map,
  check_infrastructure_delivery,
};

// Function declarations for all 13 tools
export const TOOL_DECLARATIONS = [
  {
    name: 'geocode',
    description: 'Convert a place name in Dhaka to geographic coordinates (latitude, longitude). Use this when the user mentions a location by name.',
    parameters: {
      type: 'object',
      properties: {
        place_name: { type: 'string', description: 'The place name to geocode, e.g., "Mirpur 10, Dhaka"' },
      },
      required: ['place_name'],
    },
  },
  {
    name: 'query_osm_amenities',
    description: 'Search for amenities (hospitals, schools, clinics, pharmacies) within a radius of a location using OpenStreetMap data.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lon: { type: 'number', description: 'Longitude' },
        radius_m: { type: 'number', description: 'Search radius in meters' },
        types: { type: 'array', items: { type: 'string' }, description: 'Amenity types: hospital, clinic, school, pharmacy' },
      },
      required: ['lat', 'lon', 'radius_m', 'types'],
    },
  },
  {
    name: 'query_osm_infrastructure',
    description: 'Find physical infrastructure — roads, drains, bridges, waterways, culverts — within a radius using OpenStreetMap data.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lon: { type: 'number', description: 'Longitude' },
        radius_m: { type: 'number', description: 'Search radius in meters' },
        types: { type: 'array', items: { type: 'string' }, description: 'Infrastructure types: drain, road, bridge, waterway, culvert' },
      },
      required: ['lat', 'lon', 'radius_m', 'types'],
    },
  },
  {
    name: 'get_boundary',
    description: 'Get the administrative boundary polygon for a named area (thana/district) in Dhaka.',
    parameters: {
      type: 'object',
      properties: {
        area_name: { type: 'string', description: 'Area name, e.g., "Mirpur", "Dhanmondi", "Gulshan"' },
      },
      required: ['area_name'],
    },
  },
  {
    name: 'get_air_quality',
    description: 'Get current Air Quality Index (AQI) and pollutant breakdown for a location.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lon: { type: 'number', description: 'Longitude' },
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'get_weather',
    description: 'Get current weather conditions and 24-hour forecast for a location. Includes flood-relevant rainfall data.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lon: { type: 'number', description: 'Longitude' },
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'compute_service_coverage',
    description: 'Analyze how well a service type (hospital, clinic, school, pharmacy) covers an area. Returns coverage percentage, gap zones, and recommendations.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude of area center' },
        lon: { type: 'number', description: 'Longitude of area center' },
        radius_m: { type: 'number', description: 'Analysis radius in meters' },
        service_type: { type: 'string', description: 'Service type: hospital, clinic, school, pharmacy' },
        coverage_radius_m: { type: 'number', description: 'Optional custom coverage radius per facility in meters' },
      },
      required: ['lat', 'lon', 'radius_m', 'service_type'],
    },
  },
  {
    name: 'estimate_flood_risk',
    description: 'Assess flood vulnerability based on drainage density, proximity to waterways, and recent rainfall.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lon: { type: 'number', description: 'Longitude' },
        radius_m: { type: 'number', description: 'Analysis radius in meters' },
      },
      required: ['lat', 'lon', 'radius_m'],
    },
  },
  {
    name: 'compare_locations',
    description: 'Side-by-side comparison of two areas across healthcare, education, air quality, flood risk, and infrastructure.',
    parameters: {
      type: 'object',
      properties: {
        location_a: { type: 'string', description: 'First location name' },
        location_b: { type: 'string', description: 'Second location name' },
        metrics: { type: 'array', items: { type: 'string' }, description: 'Metrics to compare: healthcare, education, air_quality, flood_risk, infrastructure' },
      },
      required: ['location_a', 'location_b', 'metrics'],
    },
  },
  {
    name: 'estimate_intervention_cost',
    description: 'Estimate cost for a proposed infrastructure intervention using Bangladesh CPTU standard costs.',
    parameters: {
      type: 'object',
      properties: {
        intervention_type: { type: 'string', description: 'Type: drain, clinic, road_repair, school, bridge' },
        scale: { type: 'string', description: 'Scale: small, medium, large' },
        location_context: { type: 'string', description: 'Optional area name for context' },
      },
      required: ['intervention_type', 'scale'],
    },
  },
  {
    name: 'search_urban_standards',
    description: 'Look up WHO, BNBC, or international urban planning benchmarks for a given metric.',
    parameters: {
      type: 'object',
      properties: {
        metric: { type: 'string', description: 'Metric: healthcare_access, education_access, drainage, air_quality, road_density, green_space' },
      },
      required: ['metric'],
    },
  },
  {
    name: 'render_on_map',
    description: 'Push GeoJSON data to the client map for visualization. Use this to show markers, polygons, circles, or heatmaps on the map.',
    parameters: {
      type: 'object',
      properties: {
        geojson: { type: 'object', description: 'GeoJSON FeatureCollection to render' },
        style: {
          type: 'object',
          description: 'Visualization style',
          properties: {
            type: { type: 'string', description: 'marker, circle, polygon, polyline, or heatmap' },
            color: { type: 'string', description: 'Hex color' },
            opacity: { type: 'number', description: 'Opacity 0-1' },
            radius: { type: 'number', description: 'Circle radius in meters' },
            weight: { type: 'number', description: 'Line weight' },
            fill_color: { type: 'string', description: 'Fill color for polygons' },
            fill_opacity: { type: 'number', description: 'Fill opacity' },
            icon: { type: 'string', description: 'Emoji or icon name for markers' },
          },
        },
        label: { type: 'string', description: 'Layer label for legend' },
        fit_bounds: { type: 'boolean', description: 'Auto-zoom to show this data' },
        layer_group: { type: 'string', description: 'Group name for toggle control' },
      },
      required: ['geojson', 'style', 'label'],
    },
  },
  {
    name: 'check_infrastructure_delivery',
    description: 'Cross-reference government spending records against physical ground truth (OSM). Computes infrastructure delivery gap score. Use when analyzing infrastructure projects or when users ask about accountability, public spending, or project delivery.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lon: { type: 'number', description: 'Longitude' },
        radius_m: { type: 'number', description: 'Search radius in meters' },
        project_type: { type: 'string', description: 'Project type: drain, road, clinic, school, bridge' },
        reported_budget_bdt: { type: 'number', description: 'Optional override budget figure in BDT' },
      },
      required: ['lat', 'lon', 'radius_m', 'project_type'],
    },
  },
];
