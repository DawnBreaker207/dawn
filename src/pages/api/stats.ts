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

async function updateBlogStats(type: StatsType, slug: string, updates: Partial<Stats>): Promise<Stats> {
  const current = await getBlogStats(slug, type);
  for (const key of NUMERIC_FIELDS) {
    const value = updates[key];
    if (typeof value === 'number' && value < current[key]) {
      updates[key] = current[key];
    }
  }
  return prisma.stats.update({
    where: { type_slug: { slug, type } },
    data: updates,
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