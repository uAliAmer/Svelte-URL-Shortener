import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

function requireAdmin(locals) {
  if (locals.apiScope) throw error(403, 'API keys cannot manage users');
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.isAdmin) throw error(403, 'Admin only');
}

export async function PATCH({ params, request, locals }) {
  requireAdmin(locals);
  const body = await request.json().catch(() => ({}));
  const data = {};
  if (typeof body.isAdmin === 'boolean') data.isAdmin = body.isAdmin;
  if (typeof body.canUseApi === 'boolean') data.canUseApi = body.canUseApi;
  if (Object.keys(data).length === 0) throw error(400, 'No valid fields');

  // Prevent demoting the last admin
  if (data.isAdmin === false) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    if (adminCount <= 1) {
      const me = await prisma.user.findUnique({ where: { id: params.id } });
      if (me?.isAdmin) throw error(400, 'Cannot demote the last admin');
    }
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, isAdmin: true, canUseApi: true }
  });
  return json({ user });
}

export async function DELETE({ params, locals, url }) {
  requireAdmin(locals);
  if (params.id === locals.user.id) throw error(400, 'Cannot delete yourself');

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) throw error(404, 'User not found');

  if (target.isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    if (adminCount <= 1) throw error(400, 'Cannot delete the last admin');
  }

  const deleteLinks = url.searchParams.get('deleteLinks') === 'true';

  if (deleteLinks) {
    // Cascade on Link.userId handles link + click deletion automatically
    await prisma.user.delete({ where: { id: params.id } });
  } else {
    // Transfer links to the current admin, then delete user
    await prisma.$transaction([
      prisma.link.updateMany({
        where: { userId: target.id },
        data: { userId: locals.user.id }
      }),
      prisma.user.delete({ where: { id: target.id } })
    ]);
  }

  return json({ ok: true });
}
