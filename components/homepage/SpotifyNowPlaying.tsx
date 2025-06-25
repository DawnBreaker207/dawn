'use client'
import useNowPlaying from 'hooks/use-not-playing'
import MusicBar from './MusicBar'
import Spotify from 'public/static/icons/spotify.svg'

const SpotifyNowPlaying = () => {
  const { songUrl, title, artist } = useNowPlaying()

  return (
    <div className="my-3 flex max-w-[540px] items-center gap-2 rounded bg-gray-200 px-3 py-2 shadow-md dark:bg-[#24283b] dark:shadow-gray-800/40">
      <Spotify className="text-spotify w-6 flex-shrink-0" />

      <div className="inline-flex truncate">
        {songUrl ? (
          <>
            <MusicBar />
            <a
              className="ml-2 font-medium dark:text-gray-200"
              href={songUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`${title} - ${artist || 'Spotify'}`}
            >
              {title}
            </a>
          </>
        ) : (
          <p className="font-medium dark:text-gray-200">Not Playing</p>
        )}
        <span className="mx-2 dark:text-gray-300">{' – '}</span>
        <p className="max-w-max truncate dark:text-gray-300">{artist || 'Spotify'}</p>
      </div>
    </div>
  )
}

export default SpotifyNowPlaying
