export interface SpotifyNowPlayingData {
  isPlaying: boolean
  status: 'playing' | 'recently-played' | 'unavailable'
  playedAt?: string
  songUrl?: string
  title?: string
  artist?: string
  album?: string
  albumImageUrl?: string
}

export interface GithubRepository {
  stargazerCount: number
  description: string
  homepageUrl: string
  languages: {
    color: string
    name: string
  }[]
  name: string
  nameWithOwner: string
  url: string
  forkCount: number
  repositoryTopics: string[]
}

export interface ViewApiResponse {
  total: string
}

export interface TagCounts {
  [tag: string]: number
}
