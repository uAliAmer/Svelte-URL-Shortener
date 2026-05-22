import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function makeClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });
}

function getClient() {
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = makeClient();
  }
  return globalForPrisma.__prisma;
}

// Lazy proxy: defers PrismaClient instantiation until first property access.
// Prevents engine load during `vite build` SSR analysis.
export const prisma = new Proxy(
  {},
  {
    get(_t, prop) {
      const client = getClient();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    }
  }
);
