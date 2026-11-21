'use client'

import { queryOptions, useQuery } from '@tanstack/react-query'

import { getGameStatusNames } from '@/api/status-settings'

export const gameStatusNamesQuery = queryOptions({
  queryKey: ['game-status-names'],
  queryFn: getGameStatusNames,
  staleTime: Infinity,
})

export function useGameStatusNames() {
  return useQuery(gameStatusNamesQuery)
}
