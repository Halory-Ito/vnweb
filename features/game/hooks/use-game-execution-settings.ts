import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { selectDirectory, selectExeFile, updateGameSettingsById } from '@/api'
import { isDesktopRuntime, pickDesktopGamePath } from '@/lib/desktop-window'
import { normalizeGameTrackingMode, resolveDefaultTrackingTarget } from '@/lib/game-tracking'

import type { GameDetail, GameTrackingMode } from '@/types'

type PickerTarget = 'exePath' | 'saveDir' | 'trackingFile' | 'trackingDirectory'

const pathPickers: Record<PickerTarget, () => Promise<string | null>> = {
  exePath: () => (isDesktopRuntime() ? pickDesktopGamePath('executable') : selectExeFile()),
  saveDir: () =>
    isDesktopRuntime() ? pickDesktopGamePath('saveDirectory') : selectDirectory('选择游戏存档目录'),
  trackingFile: () => (isDesktopRuntime() ? pickDesktopGamePath('executable') : selectExeFile()),
  trackingDirectory: () =>
    isDesktopRuntime() ? pickDesktopGamePath('saveDirectory') : selectDirectory('选择追踪目录'),
}

const targetToField: Record<PickerTarget, 'exePath' | 'saveDir' | 'trackingTarget'> = {
  exePath: 'exePath',
  saveDir: 'saveDir',
  trackingFile: 'trackingTarget',
  trackingDirectory: 'trackingTarget',
}

type RequestError = Error & { response?: { data?: { error?: string } } }

export function useGameExecutionSettings(game: GameDetail) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => ({
    exePath: game.exePath || '',
    saveDir: game.saveDir || '',
    trackingMode: normalizeGameTrackingMode(game.trackingMode),
    trackingTarget: game.trackingTarget || '',
  }))

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const setTrackingMode = (nextMode: GameTrackingMode) => {
    setForm((previous) => ({
      ...previous,
      trackingMode: nextMode,
      trackingTarget:
        nextMode === normalizeGameTrackingMode(game.trackingMode) ? game.trackingTarget || '' : '',
    }))
  }

  const defaultTrackingTarget = resolveDefaultTrackingTarget(form.trackingMode, form.exePath)

  const picker = useMutation({
    mutationFn: (target: PickerTarget) => pathPickers[target](),
    onSuccess: (pickedPath, target) => {
      if (pickedPath) {
        setField(targetToField[target], pickedPath)
      }
    },
    onError: (error: RequestError, target) => {
      const isFile = target === 'exePath' || target === 'trackingFile'
      toast.error(
        error.response?.data?.error || error.message || (isFile ? '选择文件失败' : '选择目录失败'),
      )
    },
  })

  const save = useMutation({
    mutationFn: (payload: typeof form) => updateGameSettingsById(game.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['game', String(game.id)] })
      router.refresh()
      toast.success('执行设置已保存')
    },
    onError: (error: RequestError) => {
      toast.error(error.response?.data?.error || error.message || '保存执行设置失败')
    },
  })

  return {
    form,
    defaultTrackingTarget,
    setField,
    setTrackingMode,
    picker,
    save,
  }
}
