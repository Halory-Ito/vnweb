'use client'

import { useQuery } from '@tanstack/react-query'

import { getGameById } from '@/api'

export function useGameBackdrop(gameId: number | undefined, initialGameBg?: string): string {
  const preset = initialGameBg?.trim() || ''
  const { data } = useQuery({
    queryKey: ['game', String(gameId)],
    queryFn: () => getGameById(String(gameId)),
    enabled: Boolean(gameId) && !preset,
  })
  return preset || data?.bg?.trim() || ''
}
