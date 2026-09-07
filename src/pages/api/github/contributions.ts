import type { APIRoute } from 'astro';
import { fetchContributions, type ContributionDay } from '@/lib/runtime/github';

export const prerender = false;

const TTL = 1000 * 60 * 60 * 3;
const cache: { days: ContributionDay[]; at: number } = { days: [], at: 0 };

export const GET: APIRoute = async () => {
  const now = Date.now();
  if (cache.days.length > 0 && now - cache.at < TTL) {
    return Response.json(cache.days);
  }
  try {
    const days = await fetchContributions();
    cache.days = days;
    cache.at = now;
    return Response.json(days);
  } catch {
    if (cache.days.length > 0) return Response.json(cache.days);
    return Response.json({ error: 'contributions unavailable' }, { status: 502 });
  }
};