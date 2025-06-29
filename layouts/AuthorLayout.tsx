import { CareerTimeline } from '@/components/about'
import { Avatar } from '@/components/homepage'
import { ProfileCard } from '@/components/profile/ProfileCard'
import Button from '@/components/ui/Button'
import Image from '@/components/ui/Image'
import Link from '@/components/ui/Link'
import Twemoji from '@/components/ui/Twemoji'
import type { Authors } from 'contentlayer/generated'
import { Github, Linkedin, Mail, Twitter } from 'lucide-react'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  content: Omit<Authors, '_id' | '_raw' | 'body'>
}

export default function AuthorLayout({ children, content }: Props) {
  const { name, avatar, occupation, company, email, twitter, linkedin, github } = content

  return (
    <>
      <div className="about divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:mb-6 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            About
          </h1>
          <p className="text-base text-gray-500 md:text-lg md:leading-7 dark:text-gray-400">
            Further insights into who I am and the purpose of this blog.
          </p>
        </div>

        <div className="items-start space-y-2 py-16 md:grid md:grid-cols-3 xl:space-y-0 xl:gap-x-8">
          <div className="">
            <ProfileCard />
          </div>

          <div className="prose max-w-none md:pl-10 pb-8 xl:col-span-2">
            <h2>
              Hello, folks! <Twemoji className="mx-2" emoji="waving-hand" /> I'm Tung Anh (Aka Dawn)
            </h2>
            <p>
              I have a passion for <strong>Java</strong> <strong>JavaScript/TypeScript</strong> and
              web development. I'm currently start a journey as a fullstack developer. I work mainly
              with <strong>Java</strong>, <strong>JavaScript</strong>, <strong>TypeScript</strong>,{' '}
              <strong>Angular</strong>, and <strong>Spring</strong>.
            </p>
            <p>
              I founded this blog as a means to document and share the knowledge and practical
              wisdom I've acquired during my journey as a software engineer.
            </p>
            <p>
              Writing and taking notes helps me solidify my understanding of new concepts and
              technologies. I hope my blog can be a useful resource for fellow web developers.
            </p>
            <p>
              I would greatly appreciate your thoughts and comments on what I have written{' '}
              <Twemoji emoji="clinking-beer-mugs" />.
            </p>
            <div className="flex items-center justify-between">
              <h2>My Career</h2>

              <Button as="a" href="/static/resume.pdf" target="_blank">
                <span>Resume</span>
                <Twemoji emoji="page-facing-up" />
              </Button>
            </div>
            <CareerTimeline />

            <h2>Tech stack</h2>
            <p>
              This blog is built with{' '}
              <a target="_blank" href="https://nextjs.org">
                Next.js
              </a>{' '}
              ,{' '}
              <a target="_blank" href="https://tailwindcss.com">
                Tailwind CSS
              </a>{' '}
              and{' '}
              <a target="_blank" href="https://www.notion.com">
                Notion
              </a>{' '}
              using <strong>Tailwind Nextjs Starter Blog</strong>.
            </p>

            <p>
              This blog site takes inspiration from karhdo.dev and leohuynh.dev. I appreciate{' '}
              <a target="_blank" href="https://twitter.com/karhdo">
                Khanh Do
              </a>
              ,{' '}
              <a target="_blank" href="https://twitter.com/hta218">
                Leo Huynh
              </a>{' '}
              and{' '}
              <a target="_blank" href="https://twitter.com/timlrxx">
                Timothy Lin
              </a>{' '}
              for their contribution to this minimal, lightweight, and highly customizable blog
              starter.
            </p>

            <p>A few major over-engineering-changes from the original repo:</p>

            <ul>
              <li>
                <Twemoji className="!mr-2" emoji="atom-symbol" /> Upgrading to{' '}
                <strong>React 18</strong>, <strong>Next 14</strong>.
              </li>
              <li>
                <Twemoji className="!mr-2" emoji="party-popper" /> Adopting{' '}
                <strong>Typescript</strong>, committing with{' '}
                <a target="_blank" href="https://www.conventionalcommits.org">
                  Conventional Commits
                </a>
              </li>
              <li>
                <Twemoji className="!mr-2" emoji="electric-plug" />
                Integrate{' '}
                <a target="_blank" href="https://www.notion.com">
                  Notion
                </a>{' '}
                for CMS blog
              </li>
              <li>
                <Twemoji className="!mr-2" emoji="bar-chart" /> Monitoring site with{' '}
                <a target="_blank" href="https://umami.is/">
                  Umami
                </a>{' '}
                website analytics
              </li>
              <li>
                <Twemoji className="!mr-2" emoji="eyes" /> Theming in dark mode with{' '}
                <a target="_blank" href="https://github.com/folke/tokyonight.nvim">
                  Tokyonight Neovim Theme
                </a>{' '}
                colors for better contrast.
              </li>
              <li>
                <Twemoji className="!mr-2" emoji="man-technologist" /> My website refers to the
                design and code from the{' '}
                <a target="_blank" href="https://github.com/Karhdo/karhdo.dev">
                  karhdo.dev
                </a>{' '}
                and{' '}
                <a target="_blank" href="https://github.com/hta218/leohuynh.dev">
                  leohuynh.dev
                </a>{' '}
                repository and incorporates the tailwind-nextjs-starter-blog template, version 2.0.
              </li>
              <li>
                <Twemoji className="!mr-2" emoji="inbox-tray" /> Bumping up <code>mdx-bundler</code>
                , <code>rehype</code>/<code>remark</code> plugins and dependencies to the latest
                version
              </li>
            </ul>

            <p>
              See my{' '}
              <a target="_blank" href="https://github.com/DawnBreaker207/Personal-Blog">
                repository
              </a>{' '}
              for this blog.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
