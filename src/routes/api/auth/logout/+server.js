import { json } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth.js';

export async function POST({ cookies }) {
  clearSessionCookie(cookies);
  return json({ ok: true });
}
