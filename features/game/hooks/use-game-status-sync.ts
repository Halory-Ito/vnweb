import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getGameStatusSyncAvailability, syncGameStatusToPlatform } from '@/api'
import { GAME_STATUS_SYNC_LABELS } from '@/lib/settings/game-status-sync'

import type { GameStatusSyncProvider } from '@/types'

export function useGameStatusSyncAvailability(gameId: number) {
  return useQuery({
    queryKey: ['game-status-sync-availability', gameId],
    queryFn: () => getGameStatusSyncAvailability(gameId),
    staleTime: 0,
  })
}

export function useGameStatusSync(gameId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ provider, status }: { provider: GameStatusSyncProvider; status: number }) =>
      syncGameStatusToPlatform(gameId, provider, status),
    onSuccess: ({ provider, success, error }) => {
      const name = GAME_STATUS_SYNC_LABELS[provider]
      if (success) toast.success(`${name} 游玩状态已同步`)
      else {
        toast.error(`${name}：${error}`)
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['game-status-sync-availability', gameId] }),
    onError: (_, { provider }) => toast.error(`${GAME_STATUS_SYNC_LABELS[provider]} 同步失败`),
  })
}
