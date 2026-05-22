import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  const keys = await prisma.apiKey.findMany({
    where: { userId: locals.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      prefix: true,
      scope: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true
    }
  });
  return { keys };
}
