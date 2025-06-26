import { Link, Twemoji } from '../ui'
import { GrowingUnderline } from '../ui/GrowingUnderline'

type LinkType = {
  title: string
  href: string
  emoji: string
  event: string
}
const LINKS: LinkType[] = [
  {
    title: 'My Blogs',
    href: '/blog',
    emoji: 'memo',
    event: 'home-link-blog',
  },
  {
    title: ' My Side Project',
    href: '/projects',
    emoji: 'hammer-and-wrench',
    event: 'home-link-projects',
  },
  {
    title: 'About me',
    href: '/about',
    emoji: 'face-with-monocle',
    event: 'home-link-about',
  },
  {
    title: 'My careers',
    href: '/about',
    emoji: 'briefcase',
    event: 'home-link-resume',
  },
]

const BlogLinks = () => {
  return (
    <div className="flex flex-col justify-between gap-5">
      {LINKS.map(({ title, href, emoji, event }: LinkType) => (
        <Link key={title} href={href} className="flex items-center gap-1.5">
          <Twemoji emoji={emoji} />
          <GrowingUnderline data-umami-event={event} className="leading-6">
            {title}
          </GrowingUnderline>
        </Link>
      ))}
    </div>
  )
}

export default BlogLinks
