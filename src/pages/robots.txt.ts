import { SITE } from '@/lib/site';

export const prerender = true;

export async function GET(): Promise<Response> {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${SITE.siteUrl}/sitemap.xml\nHost: ${SITE.siteUrl}`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}