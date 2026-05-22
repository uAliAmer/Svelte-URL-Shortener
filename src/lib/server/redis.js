import Redis from 'ioredis';

const url = process.env.REDIS_URL || 'redis://localhost:6379';

const globalForRedis = globalThis;

function makeRedis() {
  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false
  });
  client.on('error', (err) => {
    console.error('[redis]', err.message);
  });
  return client;
}

export const redis = globalForRedis.__redis ?? makeRedis();

if (process.env.NODE_ENV !== 'production') globalForRedis.__redis = redis;

const KEY = (code) => `link:${code}`;
const TTL = 60 * 60; // 1h

export async function cacheGet(code) {
  try {
    return await redis.get(KEY(code));
  } catch {
    return null;
  }
}

export async function cacheSet(code, originalUrl) {
  try {
    await redis.set(KEY(code), originalUrl, 'EX', TTL);
  } catch {
    /* ignore */
  }
}

export async function cacheDel(code) {
  try {
    await redis.del(KEY(code));
  } catch {
    /* ignore */
  }
}
