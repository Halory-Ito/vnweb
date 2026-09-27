'use client'

import { useEffect } from 'react'

import { recordRecentVisit } from '@/api'

import type { RecentVisitType } from '@/types'

/**
 * 进入页面时记录一次「最近访问」。
 * 同一游戏 + 同一入口类型在服务端只保留最新一条，重复访问不会产生重复卡片。
 */
export function useRecordVisit(
  gameId: number | null | undefined,
  type: RecentVisitType,
  href: string,
) {
  useEffect(() => {
    if (typeof gameId !== 'number' || !Number.isInteger(gameId) || gameId <= 0 || !href) {
      return
    }

    void recordRecentVisit({ gameId, type, href }).catch(() => {
      // 记录失败不影响页面功能，静默处理
    })
  }, [gameId, type, href])
}
