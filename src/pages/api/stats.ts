import type { APIRoute } from 'astro';
import { prisma } from '@/lib/runtime/prisma';
import { ttlCache } from '@/lib/ttl-cache';
import { getPosts } from '@/lib/utils/blog';
import type { Stats, StatsType } from '@prisma/client';

export const prerender = false;

const NUMERIC_FIELDS = ['views', 'loves', 'applauses', 'bullseye', 'ideas'] as const;
const STATS_TYPES: readonly StatsType[] = ['blog', 'snippet'];

/** Max POSTs per client + post per minute (per server instance — best effort on serverless). */
const POST_LIMIT = 30;
const postCounts = ttlCache<number>(60_000);

let knownSlugs: Set<string> | null = null;

/** Only real post ids get a stats row, so arbitrary slugs can't fill the table. */
async function isKnownSlug(slug: string): Promise<boolean> {
  knownSlugs ??= new Set((await getPosts()).map((p) => p.id));
  return knownSlugs.has(slug);
}

function parseTarget(slug: unknown, type: unknown): { slug: string; type: StatsType } | null {
  if (typeof slug !== 'string' || !slug || slug.length > 255) return null;
  if (!STATS_TYPES.includes(type as StatsType)) return null; // narrowed by the includes check
  return { slug, type: type as StatsType };
}

/** Reads the row, creating it atomically on first visit (no find-then-create race). */
function getBlogStats(slug: string, type: StatsType): Promise<Stats> {
  return prisma.stats.upsert({
    where: { type_slug: { slug, type } },
    create: { type, slug },
    update: {},
  });
}

async function updateBlogStats(type: StatsType, slug: string, updates: Record<string, unknown>): Promise<Stats> {
  const current = await getBlogStats(slug, type);
  const updateClause: Record<string, { increment: number }> = {};

  for (const key of NUMERIC_FIELDS) {
    const value = updates[key];
    if (typeof value === 'number') {
      const delta = Math.round(value - (current[key] ?? 0));
      // Ensure positive change and cap to at most 10 per request to prevent spoofing
      if (delta > 0 && delta <= 10) {
        updateClause[key] = { increment: delta };
      }
    }
  }

  if (Object.keys(updateClause).length === 0) {
    return current;
  }

  // Atomic increments: concurrent requests add up instead of overwriting each other.
  return prisma.stats.update({
    where: { type_slug: { slug, type } },
    data: updateClause,
  });
}

export const GET: APIRoute = async ({ url }) => {
  const target = parseTarget(url.searchParams.get('slug'), url.searchParams.get('type'));
  if (!target) {
    return Response.json({ message: 'Missing or invalid `type` or `slug` parameter!' }, { status: 400 });
  }
  try {
    if (!(await isKnownSlug(target.slug))) return Response.json({ message: 'Unknown slug.' }, { status: 404 });
    return Response.json(await getBlogStats(target.slug, target.type));
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Internal Server Error!' }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const data = (await request.json()) as Record<string, unknown>; // validated field by field below
    const { slug, type, ...updates } = data;
    const target = parseTarget(slug, type);
    if (!target) {
      return Response.json({ message: 'Missing `type` or `slug` parameter!' }, { status: 400 });
    }
    if (!(await isKnownSlug(target.slug))) return Response.json({ message: 'Unknown slug.' }, { status: 404 });

    const key = `${clientAddress}|${target.type}|${target.slug}`;
    const count = (postCounts.get(key) ?? 0) + 1;
    postCounts.set(key, count);
    if (count > POST_LIMIT) return Response.json({ message: 'Too many requests.' }, { status: 429 });

    return Response.json(await updateBlogStats(target.type, target.slug, updates));
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Internal Server Error!' }, { status: 500 });
  }
};
