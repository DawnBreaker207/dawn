import { existsSync, readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

// Astro doesn't load .env.local into process.env; PrismaClient reads
// DATABASE_URL from process.env at construction. Only activates when the var
// is unset (Vercel injects real env, so this is a no-op there).
function loadLocalEnv() {
  if (process.env.DATABASE_URL) return;
  try {
    const file = new URL('../../../.env.local', import.meta.url);
    if (!existsSync(file)) return;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // deploy: no file, rely on ambient env
  }
}
loadLocalEnv();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
