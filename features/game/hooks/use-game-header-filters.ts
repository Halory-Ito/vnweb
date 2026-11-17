'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useMemo } from 'react'

import { GAME_HEADER_SELECT_FILTERS } from '../data/game-header-filters'
import { GAME_PLAY_STATUS_OPTIONS, getGamePlayStatusLabel } from '../lib/game-status'
import { getGameFilterOptions } from '@/api'
import { defaultGameFilter, gameFilterAtom, gameSearchAtom } from '@/atom/global'

import type { GameFilterState } from '@/types'

export function useGameHeaderFilters() {
  const [search, setSearch] = useAtom(gameSearchAtom)
  const [filter, setFilter] = useAtom(gameFilterAtom)
  const { data: filterOptions } = useQuery({
    queryKey: ['game-filter-options'],
    queryFn: getGameFilterOptions,
    staleTime: 60_000,
  })

  const selectFilters = useMemo(
    () => [
      {
        key: 'playStatus' as const,
        label: '游玩状态',
        options: GAME_PLAY_STATUS_OPTIONS.map((status) => ({
          value: String(status),
          label: getGamePlayStatusLabel(status),
        })),
      },
      ...GAME_HEADER_SELECT_FILTERS.map(({ key, label, optionsKey }) => ({
        key,
        label,
        options: (filterOptions?.[optionsKey] ?? []).map((value) => ({ value, label: value })),
      })),
    ],
    [filterOptions],
  )

  return {
    search,
    setSearch,
    filter,
    selectFilters,
    changeFilter: (key: keyof GameFilterState, value: string) =>
      setFilter((previous) => ({ ...previous, [key]: value })),
    resetFilters: () => setFilter(defaultGameFilter),
  }
}
