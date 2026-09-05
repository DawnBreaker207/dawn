import { GithubRepository } from '@/types/server'
import projectsData from '../projectsData.json'

export interface Project {
  type: 'work' | 'self'
  title: string
  description?: string
  imgSrc: string
  url?: string
  repo?: string | GithubRepository | null
  builtWith: string[]
}

export default projectsData as Project[]