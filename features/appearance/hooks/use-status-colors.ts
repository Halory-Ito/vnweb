'use client'

import { useSyncExternalStore } from 'react'

import {
  getCachedStatusColorSettings,
  getDefaultStatusColorSettings,
  subscribeStatusColorSettings,
  type StatusColorSettings,
} from '@/lib/settings/status-settings'

/** 订阅游戏状态颜色设置，供卡片/列表等展示场景使用 */
export function useStatusColors(): StatusColorSettings {
  return useSyncExternalStore(
    subscribeStatusColorSettings,
    getCachedStatusColorSettings,
    getDefaultStatusColorSettings,
  )
}
