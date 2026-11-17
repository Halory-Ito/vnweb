'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'

import { RECENT_VISIT_FETCH_LIMIT } from '../lib/recent-visit-layout'
import { useRecentVisitLayout } from './use-recent-visit-layout'
import { getRecentVisits } from '@/api'
import { showNsfwAtom } from '@/atom/global'

export function useRecentVisits() {
  const [showNsfw] = useAtom(showNsfwAtom)
  const layout = useRecentVisitLayout()

  const query = useQuery({
    queryKey: ['recent-visits', showNsfw, RECENT_VISIT_FETCH_LIMIT],
    queryFn: () => getRecentVisits({ includeNsfw: showNsfw, limit: RECENT_VISIT_FETCH_LIMIT }),
  })

  const items = query.data?.items.slice(0, layout.columnCount) ?? []
  const visibleColumns = Math.max(1, items.length)
  const cardWidth = (layout.width - layout.gap * (visibleColumns - 1)) / visibleColumns

  return {
    ...query,
    ...layout,
    items,
    imageSizes: `${Math.max(1, Math.ceil(cardWidth))}px`,
    isLoading: query.isLoading || layout.width === 0,
  }
}
