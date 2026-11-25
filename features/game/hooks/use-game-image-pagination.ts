import { useMemo, useRef, useState } from 'react'

import type { GameImageType } from '@/lib/game-image-sources'
import type { GameSearchImageItem } from '@/types'

const PAGE_CONFIG_BY_TYPE: Record<GameImageType, { defaultSize: number; options: string[] }> = {
  cover: { defaultSize: 12, options: ['12', '24', '36'] },
  bg: { defaultSize: 9, options: ['9', '18', '27'] },
  icon: { defaultSize: 15, options: ['15', '30'] },
  logo: { defaultSize: 8, options: ['8', '16', '24'] },
}

type PaginationState = {
  images: GameSearchImageItem[]
  imageType: GameImageType
  page: number
  pageSize: number
}

/** 封装游戏媒体搜索结果的分页计算与切页回顶控制。 */
export function useGameImagePagination(images: GameSearchImageItem[], imageType: GameImageType) {
  const { defaultSize, options } = PAGE_CONFIG_BY_TYPE[imageType]
  const [state, setState] = useState<PaginationState>({
    images,
    imageType,
    page: 1,
    pageSize: defaultSize,
  })
  const scrollRef = useRef<HTMLDivElement>(null)

  const isSameContext = state.images === images && state.imageType === imageType
  const pageSize = isSameContext ? state.pageSize : defaultSize
  const rawPage = isSameContext ? state.page : 1

  const totalPages = Math.max(1, Math.ceil(images.length / pageSize))
  const currentPage = Math.min(rawPage, totalPages)
  const showPagination = totalPages > 1

  const pageImages = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return images.slice(start, start + pageSize)
  }, [currentPage, images, pageSize])

  const changePage = (nextPage: number) => {
    setState({
      images,
      imageType,
      page: Math.max(1, Math.min(nextPage, totalPages)),
      pageSize,
    })
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }

  const changePageSize = (nextPageSize: number) => {
    setState({
      images,
      imageType,
      page: 1,
      pageSize: nextPageSize,
    })
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }

  return {
    page: currentPage,
    pageSize,
    pageSizeOptions: options,
    total: images.length,
    totalPages,
    showPagination,
    pageImages,
    scrollRef,
    changePage,
    changePageSize,
  }
}
