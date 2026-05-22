import { prisma } from '$lib/server/prisma.js';
import { getSessionToken, verifyToken, clearSessionCookie } from '$lib/server/auth.js';

export async function handle({ event, resolve }) {
  const token = getSessionToken(event.cookies);
  event.locals.user = null;

  if (token) {
    const payload = verifyToken(token);
    if (payload?.sub) {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, createdAt: true }
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

  return resolve(event);
}
