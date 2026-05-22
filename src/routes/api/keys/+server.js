import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { generateApiKey } from '$lib/server/auth.js';

function requireCookieUser(locals) {
  if (locals.apiScope) throw error(403, 'API keys cannot manage other keys');
  if (!locals.user) throw error(401, 'Unauthorized');
}

export async function GET({ locals }) {
  requireCookieUser(locals);
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
  return json({ keys });
}

export async function POST({ request, locals }) {
  requireCookieUser(locals);
  if (!locals.settings?.apiKeysEnabled) throw error(403, 'API keys are disabled on this instance');
  if (!locals.user.canUseApi) throw error(403, 'Your account is not permitted to create API keys');

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 64);
  const scope = body.scope === 'read' ? 'read' : 'full';
  if (!name) throw error(400, 'Name is required');

  const { plaintext, hash, prefix } = generateApiKey(scope);

  const created = await prisma.apiKey.create({
    data: { userId: locals.user.id, name, scope, hash, prefix },
    select: { id: true, name: true, prefix: true, scope: true, createdAt: true }
  });

  return json({ key: created, plaintext });
}
