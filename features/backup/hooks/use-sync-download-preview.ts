'use client'

import { useQuery } from '@tanstack/react-query'

import { getDownloadSyncPreviewApi } from '@/features/backup/sync-server-api'

export function useSyncDownloadPreview(open: boolean) {
  const query = useQuery({
    queryKey: ['sync-backup-download-preview'],
    queryFn: async () => {
      const response = await getDownloadSyncPreviewApi()
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
    errorMessage: query.error ? (query.error as Error).message || '获取远端备份统计失败' : '',
    refetch: query.refetch,
  }
}
