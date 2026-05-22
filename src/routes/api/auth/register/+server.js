import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import {
  hashPassword,
  signToken,
  setSessionCookie,
  validateEmail,
  validatePassword
} from '$lib/server/auth.js';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => ({}));
  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';

  const emailErr = validateEmail(email);
  if (emailErr) throw error(400, emailErr);
  const pwErr = validatePassword(password);
  if (pwErr) throw error(400, pwErr);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw error(409, 'Email already registered');

  const user = await prisma.user.create({
    data: { email, password: await hashPassword(password) },
    select: { id: true, email: true }
  });

  setSessionCookie(cookies, signToken(user.id));
  return json({ user });
}
