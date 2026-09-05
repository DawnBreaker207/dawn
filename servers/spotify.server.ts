import { SPOTIFY_TOKEN_API, SPOTIFY_NOW_PLAYING_API, SPOTIFY_RECENTLY_PLAYED_API } from '@/constants/index'

const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
} = process.env

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64')

async function getAccessToken() {
  const response = await fetch(SPOTIFY_TOKEN_API, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-store',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token || '',
    }),
  })

  return response.json()
}

export async function getSpotifyNowPlaying() {
  const { access_token } = await getAccessToken()

  const url = new URL(SPOTIFY_NOW_PLAYING_API)

  url.searchParams.append('additional_types', 'track,episode')

  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
}

export async function getSpotifyRecentlyPlayed() {
  const { access_token } = await getAccessToken()

  const url = new URL(SPOTIFY_RECENTLY_PLAYED_API)

  url.searchParams.append('limit', '1')

  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
}
