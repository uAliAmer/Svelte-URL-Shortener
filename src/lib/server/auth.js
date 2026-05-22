import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.warn('[auth] JWT_SECRET is not set — using insecure dev fallback');
}
const KEY = SECRET || 'dev-insecure-secret-change-me';

const COOKIE_NAME = 'snip_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, KEY, { expiresIn: MAX_AGE });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, KEY);
  } catch {
    return null;
  }
}

export function setSessionCookie(cookies, token) {
  cookies.set(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE
  });
}

export function clearSessionCookie(cookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export function getSessionToken(cookies) {
  return cookies.get(COOKIE_NAME);
}

export function validateEmail(email) {
  if (typeof email !== 'string') return 'Email required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email';
  return null;
}

export function validatePassword(password) {
  if (typeof password !== 'string') return 'Password required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}
