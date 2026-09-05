import { SpotifyNowPlayingData } from '@/types/server'
import { getSpotifyNowPlaying, getSpotifyRecentlyPlayed } from '@/servers/spotify.server'

type SpotifyItem = {
  name: string
  type: string
  external_urls: { spotify: string }
  played_at?: string
  artists?: { name: string }[]
  album?: { name: string; images: { url: string }[] }
}

function mapEpisode(item: SpotifyItem): SpotifyNowPlayingData {
  return {
    status: 'recently-played' as const,
    isPlaying: false,
    title: item.name,
    songUrl: item.external_urls.spotify,
    playedAt: item.played_at,
  }
}

function mapTrack(item: SpotifyItem): SpotifyNowPlayingData {
  return {
    status: 'recently-played' as const,
    isPlaying: false,
    title: item.name,
    artist: item.artists?.map((art: { name: string }) => art.name).join(', '),
    album: item.album?.name,
    albumImageUrl: item.album?.images[0]?.url,
    songUrl: item.external_urls.spotify,
    playedAt: item.played_at,
  }
}

export async function GET() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_REFRESH_TOKEN) {
    return Response.json({ status: 'unavailable', isPlaying: false })
  }

  const response = await getSpotifyNowPlaying()

  if (response.status === 204 || response.status > 400) {
    const recentResponse = await getSpotifyRecentlyPlayed()

    if (recentResponse.status !== 200) {
      return Response.json({ status: 'unavailable', isPlaying: false })
    }

    const recentData = await recentResponse.json()

    const item = recentData?.items?.[0]

    if (!item) {
      return Response.json({ status: 'unavailable', isPlaying: false })
    }

    const mapped = item.track.type === 'episode' ? mapEpisode(item.track) : mapTrack(item.track)

    return Response.json({ ...mapped, playedAt: item.played_at })
  }

  const data = await response.json()

  if (!data?.item) {
    return Response.json({ status: 'unavailable', isPlaying: false })
  }

  if (data.currently_playing_type === 'episode') {
    return Response.json({
      status: 'playing',
      isPlaying: true,
      title: data.item.name,
      songUrl: data.item.external_urls.spotify,
    })
  }

  return Response.json({
    status: data.is_playing ? 'playing' : 'recently-played',
    isPlaying: data.is_playing,
    title: data.item.name,
    artist: data.item.artists.map((art: { name: string }) => art.name).join(', '),
    album: data.item.album.name,
    albumImageUrl: data.item.album.images[0]?.url,
    songUrl: data.item.external_urls.spotify,
  })
}
