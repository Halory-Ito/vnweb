'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useMemo } from 'react'

import { GAME_HEADER_SELECT_FILTERS } from '../data/game-header-filters'
import { UNKNOWN_GAME_STATUS, getGamePlayStatusOptions } from '../lib/game-status'
import { getGameFilterOptions } from '@/api'
import { defaultGameFilter, gameFilterAtom, gameSearchAtom } from '@/atom/global'
import { useGameStatusNames } from '@/features/game/hooks/use-game-status-names'

import type { GameFilterState } from '@/types'

export function useGameHeaderFilters() {
  const [search, setSearch] = useAtom(gameSearchAtom)
  const { data: statusNames } = useGameStatusNames()
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
        options: [
          ...getGamePlayStatusOptions(statusNames).map(({ value, label }) => ({
            value: String(value),
            label,
          })),
          { value: String(UNKNOWN_GAME_STATUS), label: '未知' },
        ],
      },
      ...GAME_HEADER_SELECT_FILTERS.map(({ key, label, optionsKey }) => ({
        key,
        label,
        options: (filterOptions?.[optionsKey] ?? []).map((value) => ({ value, label: value })),
      })),
    ],
    [filterOptions, statusNames],
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
