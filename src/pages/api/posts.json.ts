import type { APIRoute } from 'astro';
import { getPosts, readingMinutes } from '@/lib/utils/blog';

export const prerender = false;

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const data = posts.map((p) => ({
    id: p.id,
    title: p.data.title,
    summary: p.data.summary ?? '',
    date: p.data.date.toISOString(),
    minutes: readingMinutes(p),
    tags: p.data.tags ?? [],
  }));

  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
