import type { APIRoute } from 'astro';
import { fetchRepoData } from '@/lib/runtime/github';
import { apiCache } from '@/lib/api-cache';

export const prerender = false;

const cached = apiCache<Awaited<ReturnType<typeof fetchRepoData>>>({
  ttlMs: 1000 * 60 * 60 * 6,
  maxAge: 3600,
  sMaxAge: 21600,
  stale: 3600,
});

export const GET: APIRoute = async ({ url }) => {
  const repo = url.searchParams.get('repo');
  if (!repo) {
    return Response.json({ message: 'Missing repo parameter' }, { status: 400 });
  }
  return cached(`repo:${repo}`, () => fetchRepoData(repo));
};