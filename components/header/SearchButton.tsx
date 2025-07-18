import { AlgoliaButton } from 'pliny/search/AlgoliaButton'
import { KBarButton } from 'pliny/search/KBarButton'
import siteMetadata from '@/data/siteMetadata'
import { Command } from 'lucide-react'

const SearchButton = () => {
  if (
    siteMetadata.search &&
    (siteMetadata.search.provider === 'algolia' || siteMetadata.search.provider === 'kbar')
  ) {
    const SearchButtonWrapper =
      siteMetadata.search.provider === 'algolia' ? AlgoliaButton : KBarButton

    return (
      <SearchButtonWrapper
        aria-label="Search"
        className="dark:hover:bg-primary-600 mx-1 flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200"
      >
        <Command size={20} strokeWidth={1.5} />
      </SearchButtonWrapper>
    )
  }
}

export default SearchButton
