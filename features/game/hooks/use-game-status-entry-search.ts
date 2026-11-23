import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import { bindGameStatusSyncEntry } from '@/api'
import { searchGameByNameApi } from '@/features/game/import-api'

import type { GameStatusSyncProvider } from '@/types'

const PAGE_SIZE = 5

export function useGameStatusEntrySearch(
  gameId: number,
  provider: GameStatusSyncProvider,
  gameName: string,
  onBound: () => void,
) {
  const [keyword, setKeyword] = useState(gameName)
  const [request, setRequest] = useState({ keyword: gameName.trim(), page: 0 })
  const results = useQuery({
    queryKey: ['game-status-entry-search', provider, request.keyword, request.page],
    queryFn: () =>
      searchGameByNameApi(request.keyword, provider, request.page * PAGE_SIZE, PAGE_SIZE),
    enabled: Boolean(request.keyword),
  })
  const queryClient = useQueryClient()
  const binding = useMutation({
    mutationFn: (entryId: string) => bindGameStatusSyncEntry(gameId, provider, entryId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['game-status-sync-availability', gameId] }),
        queryClient.invalidateQueries({ queryKey: ['game', String(gameId)] }),
      ])
      toast.success('已关联平台条目')
      onBound()
    },
    onError: (error) =>
      toast.error(
        isAxiosError(error) && error.response?.status === 400 ? '条目 ID 格式无效' : '关联条目失败',
      ),
  })
  return {
    keyword,
    setKeyword,
    results,
    binding,
    hasSearched: Boolean(request.keyword),
    search: () => {
      const trimmed = keyword.trim()
      if (request.keyword === trimmed && request.page === 0) void results.refetch()
      else setRequest({ keyword: trimmed, page: 0 })
    },
    hasPrevious: request.page > 0,
    hasNext: (request.page + 1) * PAGE_SIZE < (results.data?.total ?? 0),
    changePage: (offset: number) => setRequest({ ...request, page: request.page + offset }),
  }
}
