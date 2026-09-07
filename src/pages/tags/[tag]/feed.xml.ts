import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { slugify } from '@/lib/utils/blog';
import { generateFeed, FEED_CONTENT_TYPE } from '@/lib/feed';

export const prerender = true;

type Post = CollectionEntry<'blog'>;

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  const tags = [...new Set(posts.flatMap((p) => p.data.tags.map(slugify)))];
  return tags.map((tag) => ({
    params: { tag },
    props: {
      tag,
      posts: posts.filter((p) => p.data.tags.some((t) => slugify(t) === tag)),
    },
  }));
}

export async function GET({ props }: { props: { tag: string; posts: Post[] } }): Promise<Response> {
  return new Response(generateFeed(props.posts, `tags/${props.tag}/feed.xml`), {
    headers: { 'content-type': FEED_CONTENT_TYPE },
  });
}