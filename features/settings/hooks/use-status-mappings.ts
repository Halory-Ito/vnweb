import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getGameStatusMappings, saveGameStatusMapping } from '@/api'

const queryKey = ['game-status-mappings'] as const

export function useStatusMappings() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey, queryFn: getGameStatusMappings })
  const save = useMutation({
    scope: { id: 'game-status-mappings' },
    mutationFn: (args: Parameters<typeof saveGameStatusMapping>) => saveGameStatusMapping(...args),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
      void queryClient.invalidateQueries({ queryKey: ['game-status-sync-availability'] })
    },
    onError: () => toast.error('保存平台映射失败'),
  })
  return { query, save }
}
