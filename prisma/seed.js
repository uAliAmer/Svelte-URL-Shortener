import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'demo1234';

const LINKS = [
  { code: 'gh', originalUrl: 'https://github.com/uAliAmer/Svelte-URL-Shortener' },
  { code: 'svelte', originalUrl: 'https://svelte.dev' },
  { code: 'prisma', originalUrl: 'https://www.prisma.io' },
  { code: 'tailwind', originalUrl: 'https://tailwindcss.com' }
];

async function main() {
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { isAdmin: true, mustChangeCredentials: true, password: hashed },
    create: {
      email: DEMO_EMAIL,
      password: hashed,
      isAdmin: true,
      mustChangeCredentials: true
    }
  });

  for (const link of LINKS) {
    await prisma.link.upsert({
      where: { code: link.code },
      update: {},
      create: { ...link, userId: user.id }
    });
  }

  // Sprinkle some fake clicks across the last 30 days on the first link
  const first = await prisma.link.findUnique({ where: { code: LINKS[0].code } });
  const existingClicks = await prisma.click.count({ where: { linkId: first.id } });
  if (existingClicks === 0) {
    const clicks = [];
    for (let i = 0; i < 40; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      clicks.push({
        linkId: first.id,
        ip: `10.0.0.${Math.floor(Math.random() * 254) + 1}`,
        referrer: Math.random() < 0.5 ? 'https://news.ycombinator.com/' : null,
        userAgent: 'Mozilla/5.0 (seed-script)',
        country: ['US', 'DE', 'JP', 'BR', 'EG'][Math.floor(Math.random() * 5)],
        createdAt: new Date(Date.now() - daysAgo * 86400000 - Math.random() * 86400000)
      });
    }
    await prisma.click.createMany({ data: clicks });
    await prisma.link.update({
      where: { id: first.id },
      data: { clickCount: clicks.length }
    });
  }

  console.log(`Seeded: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Links: ${LINKS.map((l) => '/' + l.code).join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
