import { redirect } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { prisma } from '$lib/server/prisma.js';
import { getSettings } from '$lib/server/settings.js';
import { mergeQrStyle, toQrcodeLibOptions } from '$lib/qrStyle.js';

export async function load({ locals, url }) {
  if (!locals.user) throw redirect(303, '/login');

  const tagFilter = url.searchParams.get('tag') || '';

  const where = { userId: locals.user.id };
  if (tagFilter) where.tag = tagFilter;

  const rows = await prisma.link.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const publicBase = (process.env.PUBLIC_BASE_URL || url.origin).replace(/\/$/, '');
  const settings = await getSettings();
  const instanceStyle = settings.qrStyle;

  const links = await Promise.all(
    rows.map(async (l) => {
      const override = l.qrStyle ? safeParse(l.qrStyle) : null;
      const style = mergeQrStyle(instanceStyle, override);
      const qrDataUrl = await QRCode.toDataURL(
        `${publicBase}/${l.code}`,
        toQrcodeLibOptions(style, { width: 192 })
      );
      return { ...l, qrDataUrl, qrStyle: style };
    })
  );

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
    publicBase
  };
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
