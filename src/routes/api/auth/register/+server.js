import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import {
  hashPassword,
  signToken,
  setSessionCookie,
  validateEmail,
  validatePassword
} from '$lib/server/auth.js';
import { rateLimit } from '$lib/server/rateLimit.js';

export async function POST(event) {
  if (event.locals.settings?.signupDisabled) throw error(403, 'Signups are disabled');

  await rateLimit(event, { bucket: 'register', limit: 5, windowSec: 3600 });

  const body = await event.request.json().catch(() => ({}));
  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';

  const emailErr = validateEmail(email);
  if (emailErr) throw error(400, emailErr);
  const pwErr = validatePassword(password);
  if (pwErr) throw error(400, pwErr);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw error(409, 'Email already registered');

  const userCount = await prisma.user.count();
  const isAdmin = userCount === 0;

  const user = await prisma.user.create({
    data: { email, password: await hashPassword(password), isAdmin },
    select: { id: true, email: true }
  });

  setSessionCookie(event.cookies, signToken(user.id));
  return json({ user });
}
