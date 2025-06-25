import { usePathname } from 'next/navigation'
import { useState } from 'react'

const loadedImages: string[] = []

const useImageLoadedState = (src: string) => {
  const pathname = usePathname()
  const uniqueImagePath = `${pathname}__${src}`

  const [loaded, setLoaded] = useState(() => loadedImages.includes(uniqueImagePath))

  return [
    loaded,
    () => {
      if (!loaded) {
        loadedImages.push(uniqueImagePath)
        setLoaded(true)
      }
    },
  ] as const
}

export default useImageLoadedState
