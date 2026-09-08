import type { APIRoute } from 'astro';
import { fetchContributions, type ContributionDay } from '@/lib/runtime/github';
import { apiCache } from '@/lib/api-cache';

export const prerender = false;

const cached = apiCache<ContributionDay[]>({
  ttlMs: 1000 * 60 * 60 * 3,
  maxAge: 3600,
  sMaxAge: 10800,
  stale: 1800,
});

export const GET: APIRoute = async () => cached('contributions', fetchContributions);