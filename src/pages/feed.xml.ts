import { getPosts } from '@/lib/utils/blog';
import { generateFeed, FEED_CONTENT_TYPE } from '@/lib/feed';

export const prerender = true;

export async function GET(): Promise<Response> {
  const posts = await getPosts();
  return new Response(generateFeed(posts, 'feed.xml'), {
    headers: { 'content-type': FEED_CONTENT_TYPE },
  });
}