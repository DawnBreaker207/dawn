import { Link, Twemoji } from '../ui'

const BlogLinks = () => {
  return (
    <div className="flex flex-col justify-between gap-5">
      <Link href="/blog" className="hover:underline">
        <Twemoji emoji="memo" />
        <span data-umami-event="home-link-blog" className="ml-1.5">
          My Blogs
        </span>
      </Link>
      <Link href="/projects" className="hover:underline">
        <Twemoji emoji="hammer-and-wrench" />
        <span data-umami-event="home-link-projects" className="ml-1.5">
          My Side Project
        </span>
      </Link>

      <Link href="/about" className="hover:underline">
        <Twemoji emoji="face-with-monocle" />
        <span data-umami-event="home-link-about" className="ml-1.5">
          About me
        </span>
      </Link>
      <Link href="/about" className="hover:underline">
        <Twemoji emoji="briefcase" />
        <span data-umami-event="home-link-resume" className="ml-1.5">
          My careers
        </span>
      </Link>
    </div>
  )
}

export default BlogLinks
