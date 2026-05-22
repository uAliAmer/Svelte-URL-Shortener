import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { cacheDel } from '$lib/server/redis.js';

async function loadOwned(locals, id) {
  if (!locals.user) throw error(401, 'Unauthorized');
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link || link.userId !== locals.user.id) throw error(404, 'Not found');
  return link;
}

export async function GET({ params, locals }) {
  const link = await loadOwned(locals, params.id);
  const clicks = await prisma.click.findMany({
    where: { linkId: link.id },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  return json({ link, clicks });
}

export async function PATCH({ params, locals, request }) {
  const link = await loadOwned(locals, params.id);
  const body = await request.json().catch(() => ({}));
  const data = {};
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.originalUrl === 'string') data.originalUrl = body.originalUrl;
  const updated = await prisma.link.update({ where: { id: link.id }, data });
  await cacheDel(link.code);
  return json({ link: updated });
}

export async function DELETE({ params, locals }) {
  const link = await loadOwned(locals, params.id);
  await prisma.link.delete({ where: { id: link.id } });
  await cacheDel(link.code);
  return json({ ok: true });
}
