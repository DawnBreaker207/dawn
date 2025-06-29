'use client'
// import NewsletterForm from 'pliny/ui/NewsletterForm'
import { PostCardListView } from '@/components/blog/PostCardListView'
import { BlogLinks, Greeting, Heading, ShortDescription, TypedBios } from '@/components/homepage'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { Twemoji } from '@/components/ui'
import Link from '@/components/ui/Link'
const MAX_DISPLAY = 5

export default function Home({ posts }) {
  return (
    <div className="relative space-y-6 pt-4 md:space-y-24 lg:pt-12">
      {/* Introduce myself */}
      <div className="mt-8 md:mt-8 dark:divide-gray-700">
        <div className="pt-6 xl:grid xl:grid-cols-3">
          <div className="hidden pt-8 xl:block">
            <ProfileCard />
          </div>
          <div className="space-y-4 md:space-y-6 md:pl-16 xl:col-span-2">
            <Greeting />
            <div className="text-base leading-7 text-gray-600 md:text-lg md:leading-8 dark:text-gray-400">
              <Heading />
              <TypedBios />
              <ShortDescription />
              <BlogLinks />
              {/* <SpotifyNowPlaying /> */}
              <p className="my-6 flex md:my-8">
                <span className="mr-2">Happy reading</span>
                <Twemoji emoji="clinking-beer-mugs" />
              </p>
            </div>{' '}
          </div>
        </div>
      </div>

      {/* <PopularTags /> */}

      {/* List all post */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="flex items-center justify-between space-y-2 py-6 font-bold sm:text-2xl sm:leading-10 md:space-y-5 md:text-4xl">
          <div className="space-y-4">
            <span className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:mr-3 md:text-5xl md:leading-14 dark:text-gray-100">
              Latest Posts
            </span>
          </div>

          <div className="items-center justify-end text-base leading-6 font-medium">
            <Link
              href="/blog"
              className="text-primary hover:text-sky-600 dark:hover:text-sky-400"
              aria-label="All posts"
            >
              All Posts &rarr;
            </Link>
          </div>
        </div>

        <ul className="divide-gray-200 pt-6 md:space-y-20 md:pt-10 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post, idx) => (
            <li key={post.slug}>
              <PostCardListView post={post} loading={idx === 0 ? 'eager' : 'lazy'} />
            </li>
          ))}
        </ul>
      </div>

      {/* {siteMetadata.newsletter.provider && (
        <div className="flex items-center justify-center pt-4">
          <NewsletterForm />
        </div>
      )} */}
    </div>
  )
}
