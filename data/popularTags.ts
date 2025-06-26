import { BrandIconType } from '@/components/ui/BrandIcon'

type PopularTag = {
  href: string
  iconType: BrandIconType
  slug: string
  title: string
}

const popularTags: PopularTag[] = [
  {
    href: '/tags/java',
    iconType: 'Java',
    slug: 'java',
    title: 'Java',
  },
  {
    href: '/tags/javascript',
    iconType: 'Javascript',
    slug: 'javascript',
    title: 'Javascript',
  },
  {
    href: '/tags/typescript',
    iconType: 'Typescript',
    slug: 'typescript',
    title: 'Typescript',
  },
  {
    href: '/tags/spring',
    iconType: 'Spring',
    slug: 'spring',
    title: 'Spring',
  },
  {
    href: '/tags/angular',
    iconType: 'Angular',
    slug: 'angular',
    title: 'Angular',
  },
  {
    href: '/tags/database',
    iconType: 'MySQL',
    slug: 'database',
    title: 'Database',
  },
]

export default popularTags
