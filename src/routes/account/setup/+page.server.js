import { redirect, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import {
  hashPassword,
  verifyPassword,
  validateEmail,
  validatePassword,
  signToken,
  setSessionCookie
} from '$lib/server/auth.js';

export function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.user.mustChangeCredentials) throw redirect(303, '/dashboard');
  return { email: locals.user.email };
}

export const actions = {
  default: async ({ request, locals, cookies }) => {
    if (!locals.user) throw redirect(303, '/login');

    const form = await request.formData();
    const currentPassword = String(form.get('currentPassword') || '');
    const newEmail = String(form.get('email') || '').toLowerCase().trim();
    const newPassword = String(form.get('password') || '');

    const emailErr = validateEmail(newEmail);
    if (emailErr) throw error(400, emailErr);
    const pwErr = validatePassword(newPassword);
    if (pwErr) throw error(400, pwErr);

    const current = await prisma.user.findUnique({ where: { id: locals.user.id } });
    if (!current) throw error(404, 'User not found');

    const ok = await verifyPassword(currentPassword, current.password);
    if (!ok) throw error(401, 'Current password is incorrect');

    if (newEmail !== current.email) {
      const taken = await prisma.user.findUnique({ where: { email: newEmail } });
      if (taken) throw error(409, 'Email already in use');
    }

    const updated = await prisma.user.update({
      where: { id: current.id },
      data: {
        email: newEmail,
        password: await hashPassword(newPassword),
        mustChangeCredentials: false
      }
    });

    setSessionCookie(cookies, signToken(updated.id));
    throw redirect(303, '/dashboard');
  }
};
