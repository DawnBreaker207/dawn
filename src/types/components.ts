import type { StatsType } from '@prisma/client';

export type ReadingTime = { text: string; minutes: number; words: number; time: number };
export type ProjectDataType = any; // projectsData.json entry

export interface ProjectCardProps {
  project: ProjectDataType;
}

export interface BlogMetaProps {
  date: string;
  slug: string;
  readingTime: ReadingTime;
}

export interface ViewCounterProps {
  slug: string;
  type: StatsType;
  className?: string;
}

export interface CommentsProps {
  className?: string;
}
