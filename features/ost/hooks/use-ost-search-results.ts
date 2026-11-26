import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { searchOstAlbumsPage, type OstAlbumSearchPage } from '../ost-api'

import type { UnifiedSearchResult } from '../types'

export const DEFAULT_OST_SEARCH_PAGE_SIZE = 10

export type OstSearchSession = {
  id: number
  keyword: string
  initialPage: OstAlbumSearchPage
  fetchedAt: number
}

export function getOstSearchAlbumKey(album: UnifiedSearchResult) {
  return `${album.source}-${album.id}`
}

export function useOstSearchResults(session: OstSearchSession, open: boolean) {
  const [page, setPage] = useState(session.initialPage.page)
  const [pageSize, setPageSize] = useState(session.initialPage.pageSize)
  const [selected, setSelected] = useState<UnifiedSearchResult[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const isInitialQuery =
    page === session.initialPage.page && pageSize === session.initialPage.pageSize

  const query = useQuery({
    queryKey: ['ost-album-search', session.id, session.keyword, page, pageSize],
    queryFn: ({ signal }) => searchOstAlbumsPage(session.keyword, { page, pageSize }, signal),
    enabled: open && Boolean(session.keyword),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    ...(isInitialQuery
      ? { initialData: session.initialPage, initialDataUpdatedAt: session.fetchedAt }
      : {}),
  })

  const activeData = query.data ?? session.initialPage
  const total = activeData.total > 0 ? activeData.total : session.initialPage.total
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeData.page, activeData.pageSize])

  const selectedKeys = new Set(selected.map(getOstSearchAlbumKey))

  const isSelected = (album: UnifiedSearchResult) => selectedKeys.has(getOstSearchAlbumKey(album))

  const changePage = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, totalPages)))
  }

  const changePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize)
    setPage(1)
  }

  const toggleAlbum = (album: UnifiedSearchResult, checked: boolean) => {
    const key = getOstSearchAlbumKey(album)
    setSelected((previous) =>
      checked
        ? previous.some((item) => getOstSearchAlbumKey(item) === key)
          ? previous
          : [...previous, album]
        : previous.filter((item) => getOstSearchAlbumKey(item) !== key),
    )
  }

  return {
    page: currentPage,
    pageSize,
    total,
    totalPages,
    showPagination:
      total > DEFAULT_OST_SEARCH_PAGE_SIZE ||
      currentPage > 1 ||
      pageSize !== DEFAULT_OST_SEARCH_PAGE_SIZE,
    pageResults: activeData.items,
    isFetching: query.isFetching,
    isError: query.isError,
    retry: () => void query.refetch(),
    selected,
    isSelected,
    scrollRef,
    changePage,
    changePageSize,
    toggleAlbum,
    reset: () => {
      setPageSize(DEFAULT_OST_SEARCH_PAGE_SIZE)
      setPage(1)
      setSelected([])
    },
  }
}
