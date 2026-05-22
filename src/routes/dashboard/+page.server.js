import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');
  const links = await prisma.link.findMany({
    where: { userId: locals.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return {
    links,
    publicBase: process.env.PUBLIC_BASE_URL || url.origin
  };
}
