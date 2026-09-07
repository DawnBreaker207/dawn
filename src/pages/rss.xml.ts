import { getPosts } from '@/lib/utils/blog';
import markdownIt from 'markdown-it';
import { SITE, SITE_URL } from '@/lib/site';
import type { APIRoute } from 'astro';

const md = new markdownIt({ html: true, linkify: true });
const esc = (s: string): string =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const items = posts
    .map((p) => {
      const link = `${SITE_URL}/blog/${p.id}`;
      const body = (p.body ?? '').trim();
      const html = body ? md.render(body).trim() : '';
      const desc = html || p.data.summary || '';
      return [
        '    <item>',
        `      <title>${esc(p.data.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${p.data.date.toUTCString()}</pubDate>`,
        html ? `      <description><![CDATA[${html}]]></description>` : desc ? `      <description>${esc(desc)}</description>` : '',
        `    </item>`,
      ].join('\n');
    })
    .join('\n');

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0">\n` +
    `  <channel>\n` +
    `    <title>${esc(SITE.title)}</title>\n` +
    `    <link>${SITE_URL}</link>\n` +
    `    <description>${esc(SITE.description)}</description>\n` +
    `    <language>en-us</language>\n` +
    `    <managingEditor>${SITE.email} (${SITE.author})</managingEditor>\n` +
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n` +
    items +
    `\n  </channel>\n` +
    `</rss>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};