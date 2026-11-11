import type { APIRoute } from 'astro';
import { prisma } from '@/lib/runtime/prisma';
import type { Stats, StatsType } from '@prisma/client';

export const prerender = false;

const NUMERIC_FIELDS = ['views', 'loves', 'applauses', 'bullseye', 'ideas'] as const;

async function getBlogStats(slug: string, type: StatsType): Promise<Stats> {
  const result =
    (await prisma.stats.findUnique({
      where: { type_slug: { slug, type } },
    })) ??
    (await prisma.stats.create({
      data: { type, slug },
    }));
  return result;
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

  return prisma.stats.update({
    where: { type_slug: { slug, type } },
    data: updateClause,
  });
}

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  const type = url.searchParams.get('type') as StatsType | null;
  if (!slug || !type) {
    return Response.json({ message: 'Missing or invalid `type` or `slug` parameter!' }, { status: 400 });
  }
  try {
    return Response.json(await getBlogStats(slug, type));
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Internal Server Error!' }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = (await request.json()) as Stats;
    const { slug, type, ...updates } = data;
    if (!slug || !type) {
      return Response.json({ message: 'Missing `type` or `slug` parameter!' }, { status: 400 });
    }
    return Response.json(await updateBlogStats(type, slug, updates));
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Internal Server Error!' }, { status: 500 });
  }
};