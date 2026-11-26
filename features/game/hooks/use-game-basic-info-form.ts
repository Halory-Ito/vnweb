import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { updateGameInfoById } from '@/api'

import type { GameDetail } from '@/types'

type FormValues = {
  name: string
  nameCn: string
  date: string
  externalSourceIds: string
  summary: string
  tags: string
  developer: string
  publisher: string
  gameType: string
  gameEngine: string
  platforms: string
  music: string
  script: string
  graphic: string
  originalPainter: string
  animationProduction: string
  programmer: string
  nsfw: boolean
}

export function useGameBasicInfoForm(game: GameDetail) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Partial<FormValues>>({})
  const formValues: FormValues = {
    name: game.name || '',
    nameCn: game.nameCn || '',
    date: game.date || '',
    externalSourceIds: game.externalSourceIds || '',
    summary: game.summary || '',
    tags: (game.tags || []).join(', '),
    developer: game.developer || '',
    publisher: game.publisher || '',
    gameType: game.gameType || '',
    gameEngine: game.gameEngine || '',
    platforms: (game.platforms || []).join(', '),
    music: game.music || '',
    script: game.script || '',
    graphic: game.graphic || '',
    originalPainter: game.originalPainter || '',
    animationProduction: game.animationProduction || '',
    programmer: game.programmer || '',
    nsfw: Boolean(game.nsfw),
    ...draft,
  }

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const save = useMutation({
    mutationFn: () =>
      updateGameInfoById(game.id, {
        name: formValues.name,
        nameCn: formValues.nameCn,
        date: formValues.date,
        externalSourceIds: formValues.externalSourceIds,
        summary: formValues.summary,
        tags: formValues.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        developer: formValues.developer,
        publisher: formValues.publisher,
        gameType: formValues.gameType,
        gameEngine: formValues.gameEngine,
        platforms: formValues.platforms
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        music: formValues.music,
        script: formValues.script,
        graphic: formValues.graphic,
        originalPainter: formValues.originalPainter,
        animationProduction: formValues.animationProduction,
        programmer: formValues.programmer,
        nsfw: formValues.nsfw,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['game'] }),
        queryClient.invalidateQueries({ queryKey: ['game-cards'] }),
        queryClient.invalidateQueries({ queryKey: ['game-sidebar'] }),
      ])
      router.refresh()
      toast.success('基本信息已更新')
      setDraft({})
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || error.message || '更新失败')
    },
  })

  return { formValues, setField, isSaving: save.isPending, handleSave: save.mutate }
}
