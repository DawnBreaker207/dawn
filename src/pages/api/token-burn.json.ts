import type { APIRoute } from 'astro';
import { fetchTokenBurn, fetchTokenBurnFull } from '@/lib/runtime/token-burn';

export const prerender = false;

const HEADERS: HeadersInit = {
  'content-type': 'application/json; charset=utf-8',
  // token-burn data changes ~once/day per machine — cache generously.
  'cache-control': 'public, s-maxage=600, stale-while-revalidate=6000',
};

export const GET: APIRoute = async ({ request }) => {
  const payload =
    new URL(request.url).searchParams.get('view') === 'full'
      ? await fetchTokenBurnFull()
      : await fetchTokenBurn();
  return new Response(JSON.stringify(payload), { headers: HEADERS });
};
