import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { getSettings } from '$lib/server/settings.js';

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

  if (!locals.user.isAdmin) {
    return { keys, users: [], stats: null, settings: await getSettings() };
  }

  const [users, settings, stats] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isAdmin: true,
        canUseApi: true,
        mustChangeCredentials: true,
        createdAt: true,
        _count: { select: { links: true, apiKeys: true } }
      },
      orderBy: { createdAt: 'asc' }
    }),
    getSettings(),
    Promise.all([
      prisma.user.count(),
      prisma.link.count(),
      prisma.click.count(),
      prisma.apiKey.count({ where: { revokedAt: null } })
    ])
  ]);

  return {
    keys,
    users,
    settings,
    stats: { users: stats[0], links: stats[1], clicks: stats[2], apiKeys: stats[3] }
  };
}
