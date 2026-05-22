import { redirect, error } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { prisma } from '$lib/server/prisma.js';
import { getSettings } from '$lib/server/settings.js';
import { mergeQrStyle, toQrcodeLibOptions } from '$lib/qrStyle.js';

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

  const settings = await getSettings();
  const instanceStyle = settings.qrStyle;
  let override = null;
  try { if (link.qrStyle) override = JSON.parse(link.qrStyle); } catch { /* ignore */ }
  const effectiveStyle = mergeQrStyle(instanceStyle, override);
  const qrDataUrl = await QRCode.toDataURL(shortUrl, toQrcodeLibOptions(effectiveStyle, { width: 256 }));

  return {
    link: { ...link, qrStyleOverride: override },
    clicks,
    byDay,
    publicBase,
    shortUrl,
    qrDataUrl,
    instanceStyle,
    effectiveStyle
  };
}
