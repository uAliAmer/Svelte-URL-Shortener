import { json, error } from '@sveltejs/kit';
import { KNOWN_SETTINGS, setSetting, getSettings } from '$lib/server/settings.js';

function requireAdmin(locals) {
  if (locals.apiScope) throw error(403, 'API keys cannot manage settings');
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.isAdmin) throw error(403, 'Admin only');
}

export async function PATCH({ request, locals }) {
  requireAdmin(locals);
  const body = await request.json().catch(() => ({}));
  for (const [k, v] of Object.entries(body)) {
    if (!KNOWN_SETTINGS[k]) continue;
    await setSetting(k, v);
  }
  return json({ settings: await getSettings() });
}
