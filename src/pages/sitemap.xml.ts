import { getPosts, POSTS_PER_PAGE, slugify } from '@/lib/utils/blog';
import { SITE_URL } from '@/lib/site';
import { headerNavLinks } from '@/lib/nav';
import type { APIRoute } from 'astro';

const staticRoutes = [
  '/',
  ...headerNavLinks.map((l) => l.href),
  '/books',
  '/heatmap',
  '/topics',
  '/lab',
  '/lab/spider',
  '/lab/terminal',
  '/help',
];

type Url = { loc: string; lastmod?: string };

const entry = (u: Url): string =>
  `  <url><loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`;

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const tags = [...new Set(posts.flatMap((p) => p.data.tags ?? []))];
  const pageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));

  const urls: Url[] = [
    ...staticRoutes.map((l) => ({ loc: l })),
    ...posts.map((p) => ({ loc: `/blog/${p.id}`, lastmod: p.data.date.toISOString() })),
    ...Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({
      loc: `/blog/page/${i + 2}`,
    })),
    ...tags.map((t) => ({ loc: `/topics/${slugify(t)}` })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(entry).join('\n') +
    `\n</urlset>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};