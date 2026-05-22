import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import {
  getSessionToken,
  verifyToken,
  clearSessionCookie,
  verifyApiKey
} from '$lib/server/auth.js';
import { getSettings } from '$lib/server/settings.js';

const USER_SELECT = {
  id: true,
  email: true,
  isAdmin: true,
  canUseApi: true,
  mustChangeCredentials: true,
  createdAt: true
};

export async function handle({ event, resolve }) {
  event.locals.user = null;
  event.locals.apiScope = null;
  event.locals.settings = await getSettings();

  // 1) API key auth (Authorization: Bearer ...)
  const authHeader = event.request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const key = authHeader.slice(7).trim();
    if (key) {
      const result = await verifyApiKey(key, USER_SELECT);
      if (result) {
        event.locals.user = result.user;
        event.locals.apiScope = result.scope;
      }
    }
  }

  // 2) Cookie session (fallback if no valid API key)
  if (!event.locals.user) {
    const token = getSessionToken(event.cookies);
    if (token) {
      const payload = verifyToken(token);
      if (payload?.sub) {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: USER_SELECT
        });
        if (user) {
          event.locals.user = user;
        } else {
          clearSessionCookie(event.cookies);
        }
      } else {
        clearSessionCookie(event.cookies);
      }
    }
  }

  // 3) Force credential rotation if flagged
  if (event.locals.user?.mustChangeCredentials && !event.locals.apiScope) {
    const path = event.url.pathname;
    const allowed =
      path === '/account/setup' ||
      path === '/api/auth/logout' ||
      path.startsWith('/_app/') ||
      path === '/favicon.svg';
    if (!allowed) throw redirect(303, '/account/setup');
  }

  return resolve(event);
}
