'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { launchGameById } from '@/api/game'

export function useGameCardLaunch(id: string, href?: string) {
  const gameHref = href || `/game/info/${id}`
  const router = useRouter()
  const queryClient = useQueryClient()
  const [exePathOpen, setExePathOpen] = useState(false)
  const [exePath, setExePath] = useState('')

  const launchMutation = useMutation({
    mutationFn: (path?: string) => launchGameById(Number(id), path),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['game', String(Number(id))] }),
        queryClient.invalidateQueries({ queryKey: ['game-cards'] }),
        queryClient.invalidateQueries({ queryKey: ['game-sidebar'] }),
      ])
      router.push(gameHref)
      router.refresh()
      toast.success('游戏已启动')
    },
    onError: (error) => {
      const detail = isAxiosError<{ error?: string; requireExePath?: boolean }>(error)
        ? error.response?.data
        : undefined
      if (detail?.requireExePath) {
        setExePathOpen(true)
        return
      }
      toast.error(detail?.error || error.message || '启动失败')
    },
  })

  function launch() {
    const gameId = Number(id)
    if (!Number.isInteger(gameId) || gameId <= 0) {
      router.push(gameHref)
      return
    }
    launchMutation.mutate(undefined)
  }

  function confirmExePath() {
    const nextExePath = exePath.trim()
    if (!nextExePath) {
      toast.error('请填写游戏可执行文件路径')
      return
    }
    setExePathOpen(false)
    launchMutation.mutate(nextExePath)
  }

  return {
    gameHref,
    launch,
    isLaunching: launchMutation.isPending,
    exePathDialog: {
      open: exePathOpen,
      onOpenChange: setExePathOpen,
      value: exePath,
      onValueChange: setExePath,
      isLaunching: launchMutation.isPending,
      onConfirm: confirmExePath,
    },
  }
}
