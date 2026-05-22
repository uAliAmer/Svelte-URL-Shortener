import { redirect, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { cacheGet, cacheSet, cacheDel } from '$lib/server/redis.js';
import { RESERVED_PATHS } from '$lib/server/codegen.js';

export async function load({ params, request, getClientAddress }) {
  const { code } = params;

  if (RESERVED_PATHS.has(code.toLowerCase())) throw error(404, 'Not found');

  let originalUrl = await cacheGet(code);
  let link = null;

  if (!originalUrl) {
    link = await prisma.link.findUnique({ where: { code } });
    if (!link || !link.isActive) throw error(404, 'Link not found');
    const now = new Date();
    if (link.activatesAt && link.activatesAt > now) {
      throw error(425, 'Link not active yet');
    }
    if (link.expiresAt && link.expiresAt < now) {
      await cacheDel(code);
      throw error(410, 'Link expired');
    }
    if (link.maxClicks != null && link.clickCount >= link.maxClicks) {
      throw error(410, 'Click limit reached');
    }
    originalUrl = link.originalUrl;
    if (link.maxClicks == null && !link.activatesAt) {
      await cacheSet(code, originalUrl);
    }
  }

  logClick(code, link, request, getClientAddress).catch((e) =>
    console.error('[click-log]', e.message)
  );

  throw redirect(302, originalUrl);
}

async function logClick(code, preloadedLink, request, getClientAddress) {
  const link = preloadedLink ?? (await prisma.link.findUnique({ where: { code } }));
  if (!link) return;

  const headers = request.headers;
  const ip = (headers.get('x-forwarded-for') || '').split(',')[0].trim() || getClientAddress();
  const referrer = headers.get('referer') || null;
  const userAgent = headers.get('user-agent') || null;
  const country = headers.get('cf-ipcountry') || headers.get('x-country') || null;

  await prisma.$transaction([
    prisma.click.create({
      data: { linkId: link.id, ip, referrer, userAgent, country }
    }),
    prisma.link.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } }
    })
  ]);
}
