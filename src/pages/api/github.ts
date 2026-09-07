import type { APIRoute } from 'astro';
import { fetchRepoData } from '@/lib/runtime/github';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const repo = url.searchParams.get('repo');
  if (!repo) {
    return Response.json({ message: 'Missing repo parameter' }, { status: 400 });
  }
  const data = await fetchRepoData(repo);
  if (!data) {
    return Response.json({ message: 'Repository data unavailable' }, { status: 502 });
  }
  return Response.json(data);
};