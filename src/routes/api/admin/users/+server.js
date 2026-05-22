import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { hashPassword, validateEmail, validatePassword } from '$lib/server/auth.js';

function requireAdmin(locals) {
  if (locals.apiScope) throw error(403, 'API keys cannot manage users');
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.isAdmin) throw error(403, 'Admin only');
}

export async function POST({ request, locals }) {
  requireAdmin(locals);
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').toLowerCase().trim();
  const password = String(body.password || '');
  const isAdmin = !!body.isAdmin;

  const emailErr = validateEmail(email);
  if (emailErr) throw error(400, emailErr);
  const pwErr = validatePassword(password);
  if (pwErr) throw error(400, pwErr);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw error(409, 'Email already registered');

  const user = await prisma.user.create({
    data: {
      email,
      password: await hashPassword(password),
      isAdmin,
      mustChangeCredentials: true
    },
    select: { id: true, email: true, isAdmin: true, canUseApi: true, createdAt: true }
  });

  return json({ user });
}
