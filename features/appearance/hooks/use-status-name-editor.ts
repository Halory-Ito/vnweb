'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { toast } from 'sonner'

import { createGameStatus, removeGameStatus, saveGameStatusNames } from '@/api/status-settings'
import { gameFilterAtom } from '@/atom/global'
import {
  gameStatusNamesQuery,
  useGameStatusNames,
} from '@/features/game/hooks/use-game-status-names'
import { gamePlayStatusLabelMap } from '@/features/game/lib/game-status'

import type { GamePlayStatus, GameStatusNames } from '@/features/game/lib/game-status'

export function useStatusNameEditor() {
  const query = useGameStatusNames()
  const queryClient = useQueryClient()
  const setGameFilter = useSetAtom(gameFilterAtom)
  const [edits, setEdits] = useState<Partial<GameStatusNames>>({})
  const [newName, setNewName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<GamePlayStatus>()
  const names = query.data ?? gamePlayStatusLabelMap
  const mutation = useMutation({
    mutationFn: saveGameStatusNames,
    onSuccess(saved) {
      queryClient.setQueryData(gameStatusNamesQuery.queryKey, saved)
      setEdits({})
      toast.success('游戏状态名称已保存')
    },
    onError() {
      toast.error('保存游戏状态名称失败，请重试')
    },
  })
  const add = useMutation({
    mutationFn: createGameStatus,
    onSuccess(saved) {
      queryClient.setQueryData(gameStatusNamesQuery.queryKey, saved.names)
      setNewName('')
      toast.success('已新增游戏状态')
    },
    onError: () => toast.error('新增游戏状态失败，请重试'),
  })
  const remove = useMutation({
    mutationFn: removeGameStatus,
    async onSuccess(saved, id) {
      queryClient.setQueryData(gameStatusNamesQuery.queryKey, saved.names)
      setEdits((previous) => {
        const next = { ...previous }
        delete next[id]
        return next
      })
      setPendingDelete(undefined)
      setGameFilter((filter) =>
        filter.playStatus === String(id) ? { ...filter, playStatus: '' } : filter,
      )
      toast.success(`状态已删除，${saved.affectedGames} 个游戏已设为「未知」`)
      await Promise.all(
        [
          'game',
          'game-cards',
          'game-sidebar',
          'collections',
          'goal-progress',
          'overview-stats',
          'record-month-report',
          'record-year-report',
        ].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
      )
    },
    onError: () => toast.error('删除游戏状态失败，请重试'),
  })
  const disabled = !query.isSuccess || mutation.isPending || add.isPending || remove.isPending
  const invalidName = Object.entries(edits).some(
    ([id, value]) => !Object.hasOwn(gamePlayStatusLabelMap, id) && !value?.trim(),
  )

  return {
    names,
    edits,
    canSave: !disabled && !invalidName && Object.keys(edits).length > 0,
    disabled,
    isSaving: mutation.isPending,
    isAdding: add.isPending,
    isDeleting: remove.isPending,
    newName,
    setNewName,
    addName: () => add.mutate(newName.trim()),
    deleteName: pendingDelete === undefined ? undefined : names[pendingDelete],
    requestDelete: setPendingDelete,
    confirmDelete: () => {
      if (pendingDelete !== undefined) remove.mutate(pendingDelete)
    },
    isError: query.isError,
    retry: () => void query.refetch(),
    updateName: (status: GamePlayStatus, name: string) =>
      setEdits((previous) => ({ ...previous, [status]: name })),
    saveNames: () => mutation.mutate(edits),
  }
}
