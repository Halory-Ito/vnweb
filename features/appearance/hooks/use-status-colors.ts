'use client'

import { useEffect, useState } from 'react'

import {
  DEFAULT_STATUS_COLOR_SETTINGS,
  STATUS_SETTINGS_EVENT,
  readStatusColorSettings,
  type StatusColorSettings,
} from '@/lib/settings/status-settings'

/** 订阅游戏状态颜色设置，供卡片/列表等展示场景使用 */
export function useStatusColors() {
  const [colors, setColors] = useState<StatusColorSettings>(DEFAULT_STATUS_COLOR_SETTINGS)

  useEffect(() => {
    let cancelled = false

    const sync = () => {
      void readStatusColorSettings().then((next) => {
        if (!cancelled) {
          setColors(next)
        }
      })
    }

    sync()
    window.addEventListener(STATUS_SETTINGS_EVENT, sync)

    return () => {
      cancelled = true
      window.removeEventListener(STATUS_SETTINGS_EVENT, sync)
    }
  }, [])

  return colors
}
