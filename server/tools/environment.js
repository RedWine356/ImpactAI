/**
 * Environment Tools (5-6): get_air_quality, get_weather
 */
import { getCached, setCache } from '../cache.js';

// ─── Tool 5: get_air_quality ───
export async function get_air_quality({ lat, lon }) {
  const cacheKey = `aqi:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = await getCached(cacheKey, 'air_quality');
  if (cached) return cached;

  const token = process.env.WAQI_TOKEN;
  if (!token) {
    return {
      error: 'WAQI_TOKEN not configured',
      aqi: null,
      source: 'WAQI API',
    };
  }

  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WAQI API error: ${res.status}`);

  const data = await res.json();
  if (data.status !== 'ok') {
    return { error: data.data || 'WAQI returned an error', aqi: null, source: 'WAQI API' };
  }

  const d = data.data;
  const aqi = d.aqi;

  let aqiLabel = 'Good';
  if (aqi > 300) aqiLabel = 'Hazardous';
  else if (aqi > 200) aqiLabel = 'Very Unhealthy';
  else if (aqi > 150) aqiLabel = 'Unhealthy';
  else if (aqi > 100) aqiLabel = 'Unhealthy for Sensitive Groups';
  else if (aqi > 50) aqiLabel = 'Moderate';

  const result = {
    aqi,
    aqi_label: aqiLabel,
    dominant_pollutant: d.dominentpol || 'pm25',
    pollutants: {
      pm25: d.iaqi?.pm25?.v ?? null,
      pm10: d.iaqi?.pm10?.v ?? null,
      o3: d.iaqi?.o3?.v ?? null,
      no2: d.iaqi?.no2?.v ?? null,
      so2: d.iaqi?.so2?.v ?? null,
      co: d.iaqi?.co?.v ?? null,
    },
    station_name: d.city?.name || 'Unknown',
    station_distance_km: null, // WAQI doesn't provide this directly
    timestamp: d.time?.iso || new Date().toISOString(),
    source: 'WAQI API',
    who_guideline_pm25: 15,
    exceedance_factor: d.iaqi?.pm25?.v ? Math.round((d.iaqi.pm25.v / 15) * 10) / 10 : null,
  };

  await setCache(cacheKey, result, 'air_quality');
  return result;
}

// ─── Tool 6: get_weather ───
export async function get_weather({ lat, lon }) {
  const cacheKey = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = await getCached(cacheKey, 'weather');
  if (cached) return cached;

  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) {
    return { error: 'OWM_API_KEY not configured', source: 'OpenWeatherMap API' };
  }

  // Fetch current weather and forecast in parallel
  const [currentRes, forecastRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
  ]);

  if (!currentRes.ok) throw new Error(`OpenWeatherMap error: ${currentRes.status}`);

  const current = await currentRes.json();
  const forecast = forecastRes.ok ? await forecastRes.json() : null;

  // Process 24h forecast
  let maxTemp = current.main.temp;
  let minTemp = current.main.temp;
  let totalRain = 0;
  let rainProb = 0;
  let forecastDesc = current.weather?.[0]?.description || '';

  // Calculate recent rainfall (last 3 days estimate from forecast data)
  let recentRain = current.rain?.['3h'] || current.rain?.['1h'] || 0;

  if (forecast?.list) {
    const next24h = forecast.list.slice(0, 8); // 8 x 3hr = 24hr
    for (const entry of next24h) {
      if (entry.main.temp_max > maxTemp) maxTemp = entry.main.temp_max;
      if (entry.main.temp_min < minTemp) minTemp = entry.main.temp_min;
      totalRain += entry.rain?.['3h'] || 0;
      if (entry.pop > rainProb) rainProb = entry.pop;
    }
    forecastDesc = next24h[0]?.weather?.[0]?.description || forecastDesc;

    // Estimate 3-day rainfall from past forecast entries
    const past24h = forecast.list.slice(0, 8);
    recentRain = past24h.reduce((sum, e) => sum + (e.rain?.['3h'] || 0), 0);
  }

  const result = {
    current: {
      temp_c: current.main.temp,
      feels_like_c: current.main.feels_like,
      humidity_percent: current.main.humidity,
      wind_speed_mps: current.wind?.speed || 0,
      description: current.weather?.[0]?.description || '',
      rain_1h_mm: current.rain?.['1h'] || null,
      visibility_m: current.visibility || null,
    },
    forecast_24h: {
      max_temp_c: Math.round(maxTemp * 10) / 10,
      min_temp_c: Math.round(minTemp * 10) / 10,
      rain_probability: Math.round(rainProb * 100) / 100,
      total_rain_mm: Math.round(totalRain * 10) / 10,
      description: forecastDesc,
    },
    flood_relevance: {
      recent_rain_mm: Math.round(recentRain * 10) / 10,
      heavy_rain_alert: totalRain > 50,
    },
    source: 'OpenWeatherMap API',
  };

  await setCache(cacheKey, result, 'weather');
  return result;
}
