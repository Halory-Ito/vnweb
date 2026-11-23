import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getPlatformVisibilityApi, savePlatformVisibilityApi } from '../settings-api'

const queryKey = ['platform-visibility'] as const

export function usePlatformVisibility() {
  const client = useQueryClient()
  const query = useQuery({ queryKey, queryFn: getPlatformVisibilityApi })
  const save = useMutation({
    scope: { id: 'platform-visibility' },
    mutationFn: savePlatformVisibilityApi,
    onMutate: () => client.cancelQueries({ queryKey }),
    onSuccess: (data) => client.setQueryData(queryKey, data),
    onError: () => toast.error('保存平台显示设置失败'),
  })
  return { query, save }
}
