'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useGamePlaySession } from './use-game-play-session'
import { updateGamePlayStatusById } from '@/api'
import { gameSearchAtom } from '@/atom/global'

import type { GameDetail } from '@/types'

const GAME_INFO_TABS = ['overview', 'characters', 'pv', 'ost', 'record', 'memory', 'quote', 'guide']

function useDialogState() {
  const [open, onOpenChange] = useState(false)
  return { open, onOpenChange }
}

export function useGameInfo(game: GameDetail, initialTab?: string) {
  const title = game.nameCn || game.name
  const currentTab = initialTab && GAME_INFO_TABS.includes(initialTab) ? initialTab : 'overview'
  const [playStatus, setPlayStatus] = useState(game.playStatus)
  const [rating, setRating] = useState(game.rating ?? 0)
  const basicInfo = useDialogState()
  const updateData = useDialogState()
  const settings = useDialogState()
  const playTime = useDialogState()
  const ratingDialog = useDialogState()
  const ost = useDialogState()
  const playStatusDialog = useDialogState()
  const session = useGamePlaySession(game)
  const queryClient = useQueryClient()
  const router = useRouter()
  const setGameSearch = useSetAtom(gameSearchAtom)

  useEffect(() => {
    setPlayStatus(game.playStatus)
    setRating(game.rating ?? 0)
  }, [game.id, game.playStatus, game.rating])

  const statusMutation = useMutation({
    mutationFn: (nextStatus: number) => updateGamePlayStatusById(game.id, nextStatus),
    onSuccess: async ({ data: { status } }) => {
      setPlayStatus(status)
      await queryClient.invalidateQueries({ queryKey: ['game', String(game.id)] })
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      router.refresh()
      toast.success('游玩状态已更新')
    },
    onError: (error) => {
      const detail = isAxiosError<{ error?: string }>(error) ? error.response?.data : undefined
      toast.error(detail?.error || error.message || '状态更新失败')
    },
  })

  const handleTabChange = (value: string) => {
    if (!GAME_INFO_TABS.includes(value) || value === currentTab) return
    router.push(`/game/info/${game.id}/${value}`)
  }

  const searchGame = (value: string) => {
    setGameSearch(value)
    router.push('/game/home')
  }

  const updatePlayStatus = (nextStatus: number) => {
    statusMutation.mutate(nextStatus)
  }

  const totalSeconds = game.totalPlayTime + (session.isRunning ? session.sessionSeconds : 0)
  const totalPlayTimeText = `${(Math.max(0, Number(totalSeconds) || 0) / 3600).toFixed(1)} 小时`

  return {
    title,
    currentTab,
    searchGame,
    handleTabChange,
    onOpenBasicInfo: () => basicInfo.onOpenChange(true),
    onOpenUpdateData: () => updateData.onOpenChange(true),
    headerProps: {
      game,
      title,
      ...session.headerProps,
      onOpenSettings: () => settings.onOpenChange(true),
    },
    statsProps: {
      totalPlayTimeText,
      lastLaunchedAt: game.lastLaunchedAt,
      playStatus,
      rating,
      isRunning: session.isRunning,
      sessionSeconds: session.sessionSeconds,
      isUpdatingStatus: statusMutation.isPending,
      onOpenPlayTime: () => playTime.onOpenChange(true),
      onOpenRating: () => ratingDialog.onOpenChange(true),
      onOpenPlayStatus: () => playStatusDialog.onOpenChange(true),
    },
    dialogs: {
      basicInfo: { ...basicInfo, game },
      updateData: { ...updateData, gameId: game.id, initialKeyword: title },
      settings: { ...settings, gameId: game.id, gameTitle: title },
      playTime: { ...playTime, gameId: game.id },
      rating: { ...ratingDialog, gameId: game.id, rating },
      ost: { ...ost, gameId: game.id },
      playStatus: {
        ...playStatusDialog,
        gameId: game.id,
        gameName: game.name || game.nameCn,
        currentStatus: playStatus,
        onStatusChange: updatePlayStatus,
        disabled: statusMutation.isPending,
      },
      exePath: session.exePathDialog,
    },
  }
}
