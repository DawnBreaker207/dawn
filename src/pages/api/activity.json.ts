import type { APIRoute } from 'astro';
import { getPosts } from '@/lib/utils/blog';
import { apiCache } from '@/lib/api-cache';
import booksData from '../../data/books.json';

export const prerender = false;

export interface ActivityItem {
  type: string;
  title: string;
  subtitle?: string;
  meta?: string;
  url?: string;
  imageUrl?: string;
  time?: string;
}

async function collect(): Promise<ActivityItem[]> {
  const [posts] = await Promise.all([getPosts()]);
  const reading = 'currentlyReading' in booksData && Array.isArray(booksData.currentlyReading) ? booksData.currentlyReading : [];

  const items: ActivityItem[] = [];

  for (const post of posts.slice(0, 2)) {
    items.push({
      type: 'blog',
      title: post.data.title,
      subtitle: post.data.summary ?? '',
      meta: 'journal',
      url: `/blog/${post.id}`,
      imageUrl: post.data.images?.[0],
      time: new Date(post.data.date).toISOString(),
    });
  }

  for (const book of (reading as any[]).slice(0, 2)) {
    items.push({
      type: 'book',
      title: book.title,
      subtitle: book.authorName,
      meta: 'reading',
      url: book.link,
      imageUrl: book.bookMediumImageUrl,
    });
  }

  return items.sort((a, b) => new Date(b.time ?? 0).valueOf() - new Date(a.time ?? 0).valueOf()).slice(0, 3);
}

const cached = apiCache<ActivityItem[]>({
  ttlMs: 1000 * 60 * 5,
  maxAge: 300,
  sMaxAge: 300,
  stale: 60,
});

export const GET: APIRoute = async () => cached('activity', collect);