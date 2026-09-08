import type { APIRoute } from 'astro';
import { fetchGithubToday } from '@/lib/runtime/github-day';
import { apiCache } from '@/lib/api-cache';

export const prerender = false;

const cached = apiCache<Awaited<ReturnType<typeof fetchGithubToday>>>({
  ttlMs: 1000 * 60 * 30,
  maxAge: 300,
  sMaxAge: 1800,
  stale: 600,
});

export const GET: APIRoute = async () => cached('today', fetchGithubToday);