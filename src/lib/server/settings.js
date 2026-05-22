import { prisma } from './prisma.js';

export const KNOWN_SETTINGS = {
  signupDisabled: { type: 'bool', default: false },
  brandTitle: { type: 'string', default: 'Snip' },
  brandTagline: { type: 'string', default: 'open-source self-hosted URL shortener' },
  defaultExpiryDays: { type: 'int', default: null },
  apiKeysEnabled: { type: 'bool', default: true }
};

let cache = null;

function parse(type, raw) {
  if (raw === null || raw === undefined) return null;
  try {
    const v = JSON.parse(raw);
    if (type === 'bool') return Boolean(v);
    if (type === 'int') return v === null ? null : Number(v);
    return String(v);
  } catch {
    return null;
  }
}

export async function getSettings() {
  if (cache) return cache;
  const out = {};
  for (const [k, meta] of Object.entries(KNOWN_SETTINGS)) out[k] = meta.default;

  try {
    const rows = await prisma.setting.findMany();
    for (const row of rows) {
      if (!KNOWN_SETTINGS[row.key]) continue;
      const parsed = parse(KNOWN_SETTINGS[row.key].type, row.value);
      if (parsed !== null) out[row.key] = parsed;
    }
  } catch (e) {
    console.error('[settings] load failed', e.message);
  }

  cache = out;
  return out;
}

export async function setSetting(key, value) {
  const meta = KNOWN_SETTINGS[key];
  if (!meta) throw new Error(`Unknown setting: ${key}`);

  let coerced = value;
  if (meta.type === 'bool') coerced = Boolean(value);
  else if (meta.type === 'int') coerced = value === null || value === '' ? null : Number(value);
  else coerced = String(value ?? '');

  await prisma.setting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(coerced) },
    update: { value: JSON.stringify(coerced) }
  });
  cache = null;
  return coerced;
}

export function invalidateSettingsCache() {
  cache = null;
}
