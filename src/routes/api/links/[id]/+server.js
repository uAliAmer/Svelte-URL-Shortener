import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { cacheDel } from '$lib/server/redis.js';
import { validateUrl } from '$lib/server/codegen.js';
import { sanitizeQrStyle } from '$lib/qrStyle.js';

async function loadOwned(locals, id) {
  if (!locals.user) throw error(401, 'Unauthorized');
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link || link.userId !== locals.user.id) throw error(404, 'Not found');
  return link;
}

function requireWrite(locals) {
  if (locals.apiScope === 'read') throw error(403, 'Read-only key');
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
  requireWrite(locals);
  const link = await loadOwned(locals, params.id);
  const body = await request.json().catch(() => ({}));
  const data = {};

  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

  if (typeof body.originalUrl === 'string') {
    const trimmed = body.originalUrl.trim();
    const urlErr = validateUrl(trimmed);
    if (urlErr) throw error(400, urlErr);
    data.originalUrl = trimmed;
  }

  if ('expiresAt' in body) {
    if (body.expiresAt === null || body.expiresAt === '') {
      data.expiresAt = null;
    } else {
      const d = new Date(body.expiresAt);
      if (isNaN(d.getTime())) throw error(400, 'Invalid expiresAt');
      data.expiresAt = d;
    }
  }

  if ('activatesAt' in body) {
    if (body.activatesAt === null || body.activatesAt === '') {
      data.activatesAt = null;
    } else {
      const d = new Date(body.activatesAt);
      if (isNaN(d.getTime())) throw error(400, 'Invalid activatesAt');
      data.activatesAt = d;
    }
  }

  if ('maxClicks' in body) {
    if (body.maxClicks === null || body.maxClicks === '') {
      data.maxClicks = null;
    } else {
      const n = Number(body.maxClicks);
      if (!Number.isInteger(n) || n <= 0) throw error(400, 'maxClicks must be a positive integer');
      data.maxClicks = n;
    }
  }

  if ('tag' in body) {
    const t = body.tag ? String(body.tag).trim().slice(0, 32) : '';
    data.tag = t || null;
  }

  if ('qrStyle' in body) {
    if (body.qrStyle === null) {
      data.qrStyle = null;
    } else {
      data.qrStyle = JSON.stringify(sanitizeQrStyle(body.qrStyle));
    }
  }

  const updated = await prisma.link.update({ where: { id: link.id }, data });
  await cacheDel(link.code);
  return json({ link: updated });
}

export async function DELETE({ params, locals }) {
  requireWrite(locals);
  const link = await loadOwned(locals, params.id);
  await prisma.link.delete({ where: { id: link.id } });
  await cacheDel(link.code);
  return json({ ok: true });
}
