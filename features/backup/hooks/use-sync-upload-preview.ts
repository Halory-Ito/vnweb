'use client'

import { useQuery } from '@tanstack/react-query'

import { getUploadSyncPreviewApi } from '@/features/backup/sync-server-api'

export function useSyncUploadPreview(open: boolean) {
  const query = useQuery({
    queryKey: ['sync-backup-upload-preview'],
    queryFn: async () => {
      const response = await getUploadSyncPreviewApi()
      return response.data.data
    },
    enabled: open,
    staleTime: 0,
    gcTime: 0,
  })

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage: query.error ? (query.error as Error).message || '获取上传备份统计失败' : '',
    refetch: query.refetch,
  }
}
