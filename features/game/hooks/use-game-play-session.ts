'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { toast } from 'sonner'

import { launchGameById, stopGameById } from '@/api'

import type { GameDetail } from '@/types'

export function useGamePlaySession(game: GameDetail) {
  const [isRunning, setIsRunning] = useState(game.isRunning)
  const [sessionSeconds, setSessionSeconds] = useState(game.currentSessionSeconds)
  const [exePathOpen, setExePathOpen] = useState(false)
  const [exePathInput, setExePathInput] = useState('')
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    setIsRunning(game.isRunning)
    setSessionSeconds(game.currentSessionSeconds)
  }, [game.id, game.isRunning, game.currentSessionSeconds])

  useEffect(() => {
    if (!isRunning) return
    const timer = window.setInterval(() => setSessionSeconds((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(timer)
  }, [isRunning])

  const launchMutation = useMutation({
    mutationFn: (exePath?: string) => launchGameById(game.id, exePath),
    onSuccess: async () => {
      setIsRunning(true)
      setSessionSeconds(0)
      await queryClient.invalidateQueries({ queryKey: ['game', String(game.id)] })
      router.refresh()
      toast.success('游戏已启动')
    },
    onError: (error) => {
      const detail = isAxiosError<{ error?: string; requireExePath?: boolean }>(error)
        ? error.response?.data
        : undefined

      if (detail?.requireExePath) {
        setExePathInput(game.exePath || '')
        setExePathOpen(true)
        return
      }
      toast.error(detail?.error || error.message || '启动失败')
    },
  })

  const stopMutation = useMutation({
    mutationFn: () => stopGameById(game.id),
    onSuccess: async () => {
      setIsRunning(false)
      setSessionSeconds(0)
      await queryClient.invalidateQueries({ queryKey: ['game', String(game.id)] })
      router.refresh()
      toast.success('游戏已结束')
    },
    onError: (error) => {
      const detail = isAxiosError<{ error?: string }>(error) ? error.response?.data : undefined
      toast.error(detail?.error || error.message || '结束失败')
    },
  })

  const confirmExePath = () => {
    const nextExePath = exePathInput.trim()
    if (!nextExePath) {
      toast.error('请填写游戏可执行文件路径')
      return
    }
    setExePathOpen(false)
    launchMutation.mutate(nextExePath)
  }

  return {
    isRunning,
    sessionSeconds,
    headerProps: {
      isRunning,
      isLaunching: launchMutation.isPending,
      isStopping: stopMutation.isPending,
      onLaunch: () => launchMutation.mutate(undefined),
      onStop: () => stopMutation.mutate(),
    },
    exePathDialog: {
      open: exePathOpen,
      onOpenChange: setExePathOpen,
      isLaunching: launchMutation.isPending,
      onConfirm: confirmExePath,
      inputProps: {
        value: exePathInput,
        onChange: (event: ChangeEvent<HTMLInputElement>) => setExePathInput(event.target.value),
        onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            confirmExePath()
          }
        },
      },
    },
  }
}
