'use client'

import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useEffect } from 'react'

import { getGameById } from '@/api'
import { bgAtom } from '@/atom/global'
import {
  getCurrentDeviceBackgroundImage,
  readBackgroundSettings,
} from '@/lib/settings/background-settings'

const getDefaultSettingsBg = () => {
  const settings = readBackgroundSettings()
  const deviceCustom = getCurrentDeviceBackgroundImage(settings)
  if (settings.customBackgroundEnabled && deviceCustom) {
    return deviceCustom
  }
  return settings.lastGameBackgroundImage
}

export function useGuideGameBackground(gameId: number) {
  const setBg = useSetAtom(bgAtom)
  const validGameId = Number.isInteger(gameId) && gameId > 0

  const { data } = useQuery({
    queryKey: ['game', String(gameId)],
    queryFn: () => getGameById(String(gameId)),
    enabled: validGameId,
  })

  useEffect(() => {
    if (!validGameId) return
    const nextBg = data?.bg?.trim()
    if (nextBg) {
      setBg(nextBg)
      return
    }
    if (data) {
      setBg(getDefaultSettingsBg())
    }
  }, [data, setBg, validGameId])

  useEffect(() => {
    return () => {
      setBg(getDefaultSettingsBg())
    }
  }, [setBg])
}
