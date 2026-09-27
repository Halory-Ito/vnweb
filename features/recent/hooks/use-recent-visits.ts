'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'

import { getRecentVisits } from '@/api'
import { showNsfwAtom } from '@/atom/global'

/** 主页只展示最近 8 条访问记录 */
export const RECENT_VISIT_LIMIT = 8

export function useRecentVisits() {
  const [showNsfw] = useAtom(showNsfwAtom)

  return useQuery({
    queryKey: ['recent-visits', showNsfw],
    queryFn: () => getRecentVisits({ includeNsfw: showNsfw, limit: RECENT_VISIT_LIMIT }),
  })
}
