import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { verifyPassword, signToken, setSessionCookie } from '$lib/server/auth.js';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => ({}));
  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';

  if (!email || !password) throw error(400, 'Email and password required');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw error(401, 'Invalid credentials');

  const ok = await verifyPassword(password, user.password);
  if (!ok) throw error(401, 'Invalid credentials');

  setSessionCookie(cookies, signToken(user.id));
  return json({ user: { id: user.id, email: user.email } });
}
