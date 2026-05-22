import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

export async function DELETE({ params, locals }) {
  if (locals.apiScope) throw error(403, 'API keys cannot revoke other keys');
  if (!locals.user) throw error(401, 'Unauthorized');

  const key = await prisma.apiKey.findUnique({ where: { id: params.id } });
  if (!key || key.userId !== locals.user.id) throw error(404, 'Not found');

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { revokedAt: new Date() }
  });
  return json({ ok: true });
}
