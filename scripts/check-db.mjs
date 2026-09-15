import { readFileSync, existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const { DATABASE_URL, DIRECT_DATABASE_URL } = loadEnv();

if (!DATABASE_URL) {
  console.error('DATABASE_URL missing (set it in .env.local or env)');
  process.exit(1);
}

const variants = [
  ['DATABASE_URL (pooler 6543)', DATABASE_URL],
  ['DIRECT_DATABASE_URL (5432)', DIRECT_DATABASE_URL],
];

for (const [label, url] of variants) {
  if (!url) continue;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const r = await prisma.$queryRaw`SELECT current_user AS u, current_database() AS db`;
    console.log(`[OK] ${label} -> user=${r[0].u} db=${r[0].db}`);
  } catch (e) {
    console.log(`[FAIL] ${label} -> ${e.message.split('\n').at(-2) || e.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

function loadEnv() {
  const out = {};
  const file = new URL('../.env.local', import.meta.url);
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.replace(/\r$/, '').match(/^\s*([\w.]+)\s*=\s*(.*)$/);
      if (m && !out[m[1]]) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return out;
}