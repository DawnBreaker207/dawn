import { SITE } from '@/lib/site';

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!
  );
}

export function getAuthor(): string {
  return `${SITE.email} (${SITE.author})`;
}

function rssItem(post: { id: string; data: { title: string; summary?: string; date: Date; tags: string[] } }): string {
  const url = `${SITE.siteUrl}/blog/${post.id}`;
  return `
  <item>
    <guid>${url}</guid>
    <title>${escapeXml(post.data.title)}</title>
    <link>${url}</link>
    ${post.data.summary ? `<description>${escapeXml(post.data.summary)}</description>` : ''}
    <pubDate>${new Date(post.data.date).toUTCString()}</pubDate>
    <author>${escapeXml(getAuthor())}</author>
    ${post.data.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('')}
  </item>
`;
}

export function generateFeed(
  posts: { id: string; data: { title: string; summary?: string; date: Date; tags: string[] } }[],
  page = 'feed.xml'
): string {
  return `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <link>${SITE.siteUrl}/blog</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>${SITE.language}</language>
    <managingEditor>${escapeXml(getAuthor())}</managingEditor>
    <webMaster>${escapeXml(getAuthor())}</webMaster>
    <lastBuildDate>${new Date(posts[0] ? posts[0].data.date : Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE.siteUrl}/${page}" rel="self" type="application/rss+xml"/>
    ${posts.map((post) => rssItem(post)).join('')}
  </channel>
</rss>
`;
}

export const FEED_CONTENT_TYPE = 'application/xml; charset=utf-8';