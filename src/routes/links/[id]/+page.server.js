import { redirect, error } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { prisma } from '$lib/server/prisma.js';

export async function load({ params, locals, url }) {
  if (!locals.user) throw redirect(303, '/login');

  const link = await prisma.link.findUnique({ where: { id: params.id } });
  if (!link || link.userId !== locals.user.id) throw error(404, 'Not found');

  const clicks = await prisma.click.findMany({
    where: { linkId: link.id },
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  // Daily aggregates over last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = await prisma.click.findMany({
    where: { linkId: link.id, createdAt: { gte: since } },
    select: { createdAt: true }
  });
  const byDay = {};
  for (const c of recent) {
    const k = c.createdAt.toISOString().slice(0, 10);
    byDay[k] = (byDay[k] || 0) + 1;
  }

  const publicBase = (process.env.PUBLIC_BASE_URL || url.origin).replace(/\/$/, '');
  const shortUrl = `${publicBase}/${link.code}`;
  const qrDataUrl = await QRCode.toDataURL(shortUrl, { margin: 1, width: 256 });

  return {
    link,
    clicks,
    byDay,
    publicBase,
    shortUrl,
    qrDataUrl
  };
}
