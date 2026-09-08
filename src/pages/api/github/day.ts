import type { APIRoute } from 'astro';
import { fetchGithubDay } from '@/lib/runtime/github-day';
import { apiCache } from '@/lib/api-cache';

export const prerender = false;

const cached = apiCache<Awaited<ReturnType<typeof fetchGithubDay>>>({
  ttlMs: 1000 * 60 * 60 * 24,
  maxAge: 3600,
  sMaxAge: 3600,
  stale: 86400,
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get('date');
  if (!date || !DATE_RE.test(date)) {
    return new Response(
      JSON.stringify({ ok: false, date: date ?? '', error: 'Invalid date.' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }
  return cached(`day:${date}`, () => fetchGithubDay(date));
};