import { useRef, useState } from 'react'

import type { UnifiedSearchResult } from '../types'

const DEFAULT_PAGE_SIZE = 10

export function useOstSearchResults(results: UnifiedSearchResult[]) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selected, setSelected] = useState<UnifiedSearchResult[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize

  const changePage = (nextPage: number) => {
    setPage(nextPage)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }

  const changePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize)
    changePage(1)
  }

  const toggleAlbum = (album: UnifiedSearchResult, checked: boolean) => {
    setSelected((previous) =>
      checked ? [...previous, album] : previous.filter((item) => item !== album),
    )
  }

  return {
    page: currentPage,
    pageSize,
    totalPages,
    showPagination: results.length > DEFAULT_PAGE_SIZE,
    pageResults: results.slice(start, start + pageSize),
    selected,
    scrollRef,
    changePage,
    changePageSize,
    toggleAlbum,
    reset: () => {
      changePageSize(DEFAULT_PAGE_SIZE)
      setSelected([])
    },
  }
}
