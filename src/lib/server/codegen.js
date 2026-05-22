import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const RESERVED = new Set([
  'api',
  'login',
  'logout',
  'register',
  'dashboard',
  'links',
  'health',
  'favicon.ico',
  'robots.txt',
  '_app',
  'admin'
]);

export function randomCode(length = 7) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function validateSlug(slug) {
  if (typeof slug !== 'string') return 'Slug must be a string';
  if (slug.length < 3 || slug.length > 32) return 'Slug must be 3–32 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) return 'Slug may only contain letters, numbers, _ and -';
  if (RESERVED.has(slug.toLowerCase())) return 'That slug is reserved';
  return null;
}

export function validateUrl(url) {
  if (typeof url !== 'string') return 'URL must be a string';
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return 'URL must use http or https';
    return null;
  } catch {
    return 'Invalid URL';
  }
}

export const RESERVED_PATHS = RESERVED;
