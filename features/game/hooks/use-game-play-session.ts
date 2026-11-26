'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { toast } from 'sonner'

import { getGameRuntimeById, launchGameById, stopGameById } from '@/api'

import type { GameDetail } from '@/types'

export function useGamePlaySession(game: GameDetail) {
  const [isRunning, setIsRunning] = useState(game.isRunning)
  const [sessionSeconds, setSessionSeconds] = useState(game.currentSessionSeconds)
  const [exePathOpen, setExePathOpen] = useState(false)
  const [exePathInput, setExePathInput] = useState('')
  const autoStopLockRef = useRef(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    setIsRunning(game.isRunning)
    setSessionSeconds(game.currentSessionSeconds)
    if (game.isRunning) {
      autoStopLockRef.current = false
    }
  }, [game.id, game.isRunning, game.currentSessionSeconds])

  useEffect(() => {
    if (!isRunning) return
    const timer = window.setInterval(() => setSessionSeconds((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(timer)
  }, [isRunning])

  const launchMutation = useMutation({
    mutationFn: (exePath?: string) => launchGameById(game.id, exePath),
    onSuccess: async () => {
      autoStopLockRef.current = false
      queryClient.setQueryData(['game-runtime', game.id], {
        isRunning: true,
        currentSessionSeconds: 0,
      })
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
      autoStopLockRef.current = true
      queryClient.removeQueries({ queryKey: ['game-runtime', game.id] })
      setIsRunning(false)
      setSessionSeconds(0)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['game', String(game.id)] }),
        queryClient.invalidateQueries({ queryKey: ['game-records', game.id] }),
        queryClient.invalidateQueries({ queryKey: ['game-cards'] }),
        queryClient.invalidateQueries({ queryKey: ['collections'] }),
      ])
      router.refresh()
      toast.success('游戏已结束')
    },
    onError: (error) => {
      const detail = isAxiosError<{ error?: string }>(error) ? error.response?.data : undefined
      toast.error(detail?.error || error.message || '结束失败')
    },
  })

  const runtimeQuery = useQuery({
    queryKey: ['game-runtime', game.id],
    queryFn: () => getGameRuntimeById(game.id),
    enabled: isRunning && !stopMutation.isPending,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 0,
  })

  useEffect(() => {
    const runtime = runtimeQuery.data
    if (!isRunning || !runtime || stopMutation.isPending) {
      return
    }

    if (runtime.isRunning) {
      setSessionSeconds(runtime.currentSessionSeconds)
      return
    }

    if (autoStopLockRef.current) {
      return
    }

    autoStopLockRef.current = true
    setIsRunning(false)
    setSessionSeconds(0)
    queryClient.removeQueries({ queryKey: ['game-runtime', game.id] })
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ['game', String(game.id)] }),
      queryClient.invalidateQueries({ queryKey: ['game-records', game.id] }),
      queryClient.invalidateQueries({ queryKey: ['game-cards'] }),
      queryClient.invalidateQueries({ queryKey: ['collections'] }),
    ]).then(() => {
      router.refresh()
    })
    toast.success('检测到游戏已关闭，已自动保存本次游玩记录')
  }, [game.id, isRunning, queryClient, router, runtimeQuery.data, stopMutation.isPending])

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
