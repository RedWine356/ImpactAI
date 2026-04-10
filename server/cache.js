/**
 * Cache layer — in-memory with TTL.
 * Optionally connects to Redis if REDIS_URL is set and reachable.
 */

const TTL = {
  geocode: 24 * 60 * 60,      // 24 hours
  osm_query: 5 * 60,           // 5 minutes
  air_quality: 30 * 60,        // 30 minutes
  weather: 15 * 60,            // 15 minutes
  boundary: 0,                 // never expires (pre-loaded)
  projects: 0,                 // never expires (pre-loaded)
};

let redis = null;
const memoryCache = new Map();

export async function initCache(redisUrl) {
  if (!redisUrl) {
    console.log('[Cache] No REDIS_URL — using in-memory cache');
    return;
  }

  try {
    const { default: Redis } = await import('ioredis');
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 1) return null;
        return 500;
      },
      lazyConnect: true,
      connectTimeout: 3000,
    });

    redis.on('error', () => { redis = null; });

    await redis.connect();
    console.log('[Cache] Redis connected');
  } catch {
    console.log('[Cache] Redis unavailable — using in-memory cache');
    redis = null;
  }
}

export async function getCached(key, category = 'osm_query') {
  const ttl = TTL[category] || 300;

  if (redis) {
    try {
      const val = await redis.get(key);
      if (val) return JSON.parse(val);
    } catch {
      // fallback to memory
    }
  }

  const entry = memoryCache.get(key);
  if (entry) {
    if (ttl === 0 || Date.now() - entry.timestamp < ttl * 1000) {
      return entry.data;
    }
    memoryCache.delete(key);
  }
  return null;
}

export async function setCache(key, data, category = 'osm_query') {
  const ttl = TTL[category] || 300;

  if (redis) {
    try {
      if (ttl === 0) {
        await redis.set(key, JSON.stringify(data));
      } else {
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
      }
    } catch {
      // fallback to memory
    }
  }

  memoryCache.set(key, { data, timestamp: Date.now() });
}

export { TTL };
