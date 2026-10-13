'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useMemo } from 'react'

import { getGameCardList } from '@/api'
import { showNsfwAtom } from '@/atom/global'

export function useDashboardGames() {
  const [showNsfw] = useAtom(showNsfwAtom)

  const query = useQuery({
    queryKey: ['game-cards', showNsfw],
    queryFn: () => getGameCardList({ includeNsfw: showNsfw }),
  })

  const cards = useMemo(() => query.data ?? [], [query.data])

  const totalPlayTime = useMemo(
    () => cards.reduce((sum, item) => sum + Math.max(0, Number(item.playTime) || 0), 0),
    [cards],
  )

  const completedCount = useMemo(
    () => cards.filter((item) => item.status === 3 || item.status === 4).length,
    [cards],
  )

  return {
    ...query,
    cards,
    totalPlayTime,
    completedCount,
  }
}
