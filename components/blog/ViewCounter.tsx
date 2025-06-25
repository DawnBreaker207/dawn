import { useBlogStats, useUpdateBlogStats } from 'hooks'
import { useEffect } from 'react'
import { ViewCounterProps } from 'types'

const ViewCounter = ({ type, slug, className }: ViewCounterProps) => {
  const [stats, isLoading] = useBlogStats(type, slug)
  const updateView = useUpdateBlogStats()

  useEffect(() => {
    if (!isLoading && stats) {
      updateView({ type, slug, views: stats['views'] + 1 })
    }
  }, [stats, isLoading])

  return (
    <span className={className}>
      {stats['views'] > 0 ? stats['views'].toLocaleString() : '---'} views
    </span>
  )
}

export default ViewCounter
