import { error } from '@sveltejs/kit';
import { redis } from './redis.js';

export async function rateLimit(event, { bucket, limit, windowSec }) {
  const ip =
    event.getClientAddress?.() ||
    event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const key = `rl:${bucket}:${ip}`;

  let count;
  try {
    count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);
  } catch {
    return;
  }

  if (count > limit) {
    let ttl = windowSec;
    try {
      ttl = await redis.ttl(key);
    } catch {
      /* ignore */
    }
    throw error(429, `Too many requests. Try again in ${ttl > 0 ? ttl : windowSec}s.`);
  }
}
