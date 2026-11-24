'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { batchDeleteGameMemoriesById } from '@/api'

import type { GameMemoryItem } from '@/types'

export function useGameMemoryBatchDelete(gameId: number, items: GameMemoryItem[]) {
  const queryClient = useQueryClient()
  const [active, setActive] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(() => new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const allSelected = items.length > 0 && items.every(({ id }) => selectedIds.has(id))

  const exit = useCallback(() => {
    setActive(false)
    setSelectedIds(new Set())
    setConfirmOpen(false)
  }, [])

  const toggle = useCallback((id: number) => {
    setActive(true)
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (!next.delete(id)) {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      for (const { id } of items) {
        if (allSelected) {
          next.delete(id)
        } else {
          next.add(id)
        }
      }
      return next
    })
  }, [allSelected, items])

  const deletion = useMutation({
    mutationFn: (ids: number[]) => batchDeleteGameMemoriesById(gameId, ids),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['game-memory', gameId] })
      toast.success(`已删除 ${result.deleted} 条回忆`)
      exit()
    },
    onError: () => {
      toast.error('批量删除失败，请重试')
    },
  })

  return {
    active,
    enter: () => setActive(true),
    exit,
    selectedIds,
    allSelected,
    toggle,
    toggleAll,
    confirmOpen,
    setConfirmOpen,
    confirmDelete: () => {
      const ids = [...selectedIds]
      if (ids.length > 0 && !deletion.isPending) {
        deletion.mutate(ids)
      }
    },
    isDeleting: deletion.isPending,
  }
}
