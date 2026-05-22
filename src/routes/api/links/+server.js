import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { randomCode, validateSlug, validateUrl } from '$lib/server/codegen.js';

export async function GET({ locals, url }) {
  if (!locals.user) throw error(401, 'Unauthorized');

  const take = Math.min(Number(url.searchParams.get('take')) || 50, 200);
  const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);

  const [items, total] = await Promise.all([
    prisma.link.findMany({
      where: { userId: locals.user.id },
      orderBy: { createdAt: 'desc' },
      take,
      skip
    }),
    prisma.link.count({ where: { userId: locals.user.id } })
  ]);

  return json({ items, total });
}

export async function POST({ request, locals }) {
  if (!locals.user) throw error(401, 'Unauthorized');

  const body = await request.json().catch(() => ({}));
  const originalUrl = (body.originalUrl || '').trim();
  const customSlug = body.customSlug ? String(body.customSlug).trim() : null;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  const urlErr = validateUrl(originalUrl);
  if (urlErr) throw error(400, urlErr);

  if (expiresAt && (isNaN(expiresAt.getTime()) || expiresAt < new Date())) {
    throw error(400, 'expiresAt must be a future date');
  }

  let code = customSlug;
  if (code) {
    const slugErr = validateSlug(code);
    if (slugErr) throw error(400, slugErr);
    const taken = await prisma.link.findUnique({ where: { code } });
    if (taken) throw error(409, 'Slug already taken');
  } else {
    // collision-retry random
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = randomCode(7);
      const existing = await prisma.link.findUnique({ where: { code: candidate } });
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) throw error(500, 'Failed to generate unique code');
  }

  const link = await prisma.link.create({
    data: {
      code,
      originalUrl,
      userId: locals.user.id,
      expiresAt
    }
  });

  return json({ link });
}
