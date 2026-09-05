import useSWR from 'swr'

import { fetcher } from '@/utils/index'

import type { SpotifyNowPlayingData } from '@/types/index'

export default function useNowPlaying() {
  const { data } = useSWR<SpotifyNowPlayingData>('/api/spotify', fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    focusThrottleInterval: 15_000,
  })

  return {
    data: data || { status: 'unavailable', isPlaying: false },
    isLoading: !data,
  }
}