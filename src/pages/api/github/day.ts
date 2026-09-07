import type { APIRoute } from 'astro';
import { fetchGithubDay } from '@/lib/runtime/github-day';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response(
      JSON.stringify({ ok: false, date: date ?? '', error: 'Invalid date.' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }
  const payload = await fetchGithubDay(date);
  return new Response(JSON.stringify(payload), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=864000',
    },
  });
};