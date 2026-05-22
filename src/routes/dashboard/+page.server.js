import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');

  const tagFilter = url.searchParams.get('tag') || '';

  const where = { userId: locals.user.id };
  if (tagFilter) where.tag = tagFilter;

  const links = await prisma.link.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const tagRows = await prisma.link.findMany({
    where: { userId: locals.user.id, tag: { not: null } },
    distinct: ['tag'],
    select: { tag: true },
    orderBy: { tag: 'asc' }
  });
  const tags = tagRows.map((r) => r.tag);

  return {
    links,
    tags,
    activeTag: tagFilter,
    publicBase: process.env.PUBLIC_BASE_URL || url.origin
  };
}
