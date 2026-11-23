import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getGameStatusPushColors, saveGameStatusPushColor } from '@/api'

import type { GameStatusPushColors, GameStatusPushState } from '@/types'

const queryKey = ['game-status-push-colors'] as const

export function useStatusPushColors() {
  return useQuery({ queryKey, queryFn: getGameStatusPushColors })
}

export function useSaveStatusPushColor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ state, color }: { state: GameStatusPushState; color: string }) =>
      saveGameStatusPushColor(state, color),
    onSuccess: (_, { state, color }) => {
      queryClient.setQueryData<GameStatusPushColors>(
        queryKey,
        (colors) => colors && { ...colors, [state]: color },
      )
    },
    onError: () => {
      toast.error('保存指示点颜色失败')
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}
