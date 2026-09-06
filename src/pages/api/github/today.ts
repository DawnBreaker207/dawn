import type { APIRoute } from 'astro';
import { fetchGithubToday } from '@/lib/runtime/github-day';

export const prerender = false;

export const GET: APIRoute = async () => {
  const payload = await fetchGithubToday();
  return new Response(JSON.stringify(payload), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, s-maxage=120, stale-while-revalidate=1200',
    },
  });
};