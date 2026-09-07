import { SITE } from '@/lib/site';
import { escapeXml } from '@/lib/feed';
import { getPosts } from '@/lib/utils/blog';

export const prerender = true;

export async function GET(): Promise<Response> {
  const today = new Date().toISOString().split('T')[0];
  const routes = ['', 'blog', 'projects', 'tags'].map((route) => ({
    url: `${SITE.siteUrl}/${route}`,
    lastModified: today,
  }));

  const posts = await getPosts();
  const blogRoutes = posts.map((post) => ({
    url: `${SITE.siteUrl}/blog/${post.id}`,
    lastModified: post.data.date.toISOString(),
  }));

  const urls = [...routes, ...blogRoutes]
    .map(
      ({ url, lastModified }) =>
        `<url>\n<loc>${escapeXml(url)}</loc>\n<lastmod>${lastModified}</lastmod>\n</url>`
    )
    .join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}