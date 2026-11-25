import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getPlatformVisibilityApi, savePlatformVisibilityApi } from '../settings-api'
import { useHydrated } from '@/hooks/use-hydrated'

const queryKey = ['platform-visibility'] as const

export function usePlatformVisibility() {
  const hydrated = useHydrated()
  const client = useQueryClient()
  const query = useQuery({ queryKey, queryFn: getPlatformVisibilityApi })
  const { data, isLoadingError, refetch } = query
  const save = useMutation({
    scope: { id: 'platform-visibility' },
    mutationFn: savePlatformVisibilityApi,
    onMutate: () => client.cancelQueries({ queryKey }),
    onSuccess: (nextData) => client.setQueryData(queryKey, nextData),
    onError: () => toast.error('保存平台显示设置失败'),
  })
  return {
    query: {
      data: hydrated ? data : undefined,
      isLoadingError: hydrated ? isLoadingError : false,
      refetch,
    },
    save,
  }
}
