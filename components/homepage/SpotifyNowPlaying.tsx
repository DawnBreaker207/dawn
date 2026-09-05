'use client'
import useNowPlaying from 'hooks/use-not-playing'
import MusicBar from './MusicBar'
import Spotify from 'public/static/icons/spotify.svg'

function formatRelativeTime(iso?: string): string {
  if (!iso) return 'recently'
  const elapsedMs = Date.now() - new Date(iso).getTime()
  const seconds = Math.round(elapsedMs / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const SpotifyNowPlaying = ({ className }: { className?: string }) => {
  const { data, isLoading } = useNowPlaying()

  if (isLoading) {
    return (
      <div className="my-3 flex max-w-[540px] items-center gap-2 rounded bg-gray-200 px-3 py-2 shadow-md dark:bg-[#24283b] dark:shadow-gray-800/40">
        <span className="h-4 w-4 flex-shrink-0 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
        <span className="h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
      </div>
    )
  }

  const isPlaying = data.status === 'playing'

  if (!isPlaying && data.status === 'unavailable') {
    return (
      <div className="my-3 flex max-w-[540px] items-center gap-2 rounded bg-gray-200 px-3 py-2 shadow-md dark:bg-[#24283b] dark:shadow-gray-800/40">
        <Spotify className="text-spotify w-6 flex-shrink-0" />
        <p className="font-medium dark:text-gray-200">Not Playing</p>
      </div>
    )
  }

  const isRecentlyPlayed = data.status === 'recently-played'

  return (
    <div
      className={[
        'my-3 flex max-w-[540px] items-center gap-2 rounded bg-gray-200 px-3 py-2 shadow-md dark:bg-[#24283b] dark:shadow-gray-800/40',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Spotify className="text-spotify w-6 flex-shrink-0" />

      <div className="inline-flex min-w-0 truncate">
        {isPlaying ? (
          <MusicBar />
        ) : isRecentlyPlayed ? (
          <span className="mr-2 text-xs tracking-wide text-gray-500 uppercase">
            Last played · {formatRelativeTime(data.playedAt)}
          </span>
        ) : null}
        <a
          className="ml-1 truncate font-medium dark:text-gray-200"
          href={data.songUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`${data.title} - ${data.artist || 'Spotify'}`}
        >
          {data.title}
        </a>
        <span className="mx-2 dark:text-gray-300">{' – '}</span>
        <p className="max-w-max truncate dark:text-gray-300">{data.artist || 'Spotify'}</p>
      </div>
    </div>
  )
}

export default SpotifyNowPlaying
