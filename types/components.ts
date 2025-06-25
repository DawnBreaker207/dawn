import type readingTime from 'reading-time'

import type { StatsType } from '@prisma/client'
import type projectsData from '@/data/projectsData'
import GiscusConfigs from './giscus-config.type'

export type ProjectDataType = (typeof projectsData)[0]

export interface ProjectCardProps {
  project: ProjectDataType
}

export type ReadingTime = ReturnType<typeof readingTime>

export interface BlogMetaProps {
  date: string
  slug: string
  readingTime: ReadingTime
}

export interface ViewCounterProps {
  slug: string
  type: StatsType
  className?: string
}

export interface CommentsProps {
  className?: string
  configs?: Partial<GiscusConfigs>
}

export interface ScrollButtonProps {
  onClick: () => void
  ariaLabel: string
  icon: React.FC<React.SVGProps<SVGSVGElement>>
}
