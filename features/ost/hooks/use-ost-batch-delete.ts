'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { deleteOstManageItems } from '@/api'

import type { OstItem } from '../types'

export function useOstBatchDelete(items: OstItem[]) {
  const queryClient = useQueryClient()
  const [active, setActive] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(() => new Set())
  const [pendingIds, setPendingIds] = useState<number[]>([])
  const allOnPageSelected = items.length > 0 && items.every(({ id }) => selectedIds.has(id))

  const exit = () => {
    setActive(false)
    setSelectedIds(new Set())
  }

  const toggle = useCallback(({ id }: OstItem) => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }, [])

  const togglePage = () => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      for (const { id } of items) {
        if (allOnPageSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  const deletion = useMutation({
    mutationFn: deleteOstManageItems,
    onSuccess: async (_, ids) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ost-manage'] }),
        queryClient.invalidateQueries({ queryKey: ['game-ost-albums'] }),
      ])
      toast.success(`已删除 ${ids.length} 张 OST`)
      setPendingIds([])
      exit()
    },
    onError: () => toast.error('批量删除失败，请重试'),
  })

  return {
    active,
    enter: () => setActive(true),
    exit,
    selectedIds,
    toggle,
    togglePage,
    allOnPageSelected,
    pendingCount: pendingIds.length,
    requestDelete: () => setPendingIds([...selectedIds]),
    cancelDelete: () => setPendingIds([]),
    confirmDelete: () => {
      if (pendingIds.length && !deletion.isPending) deletion.mutate(pendingIds)
    },
    isDeleting: deletion.isPending,
  }
}
