import Link from 'next/link'
import { slug } from 'github-slugger'
import clsx from 'clsx'

export function TagsList({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {tags.map((tag) => (
        <Tag key={tag} text={tag} />
      ))}
    </div>
  )
}

const Tag = ({ text, size = 'sm' }: { text: string; size?: 'sm' | 'md' }) => {
  let tagName = text.split(' ').join('-')
  return (
    <Link
      href={`/tags/${slug(text)}`}
      className={clsx([
        'rounded-lg px-2 py-0.5 font-semibold',
        'bg-slate-100 hover:bg-slate-300 dark:bg-slate-300 dark:hover:bg-slate-100',
        'text-primary-500 dark:text-primary-700 text-sm font-medium lowercase',
        size === 'sm' ? 'text-sm' : 'text-base',
      ])}
    >
      <span data-umami-event={`tag-${tagName}`}>#{tagName}</span>
    </Link>
  )
}

export default Tag
