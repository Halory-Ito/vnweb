import type { GoalSettings } from '@/types'

/** 目标设置的兜底默认值（与 `app/api/settings/goals` 保持一致） */
export const DEFAULT_GOAL_SETTINGS: GoalSettings = {
  dailyPlayMinutes: 60,
  yearlyCompletedGames: 12,
}

/** 计算目标完成百分比，封顶 100% */
export const calcGoalPercent = (current: number, target: number) => {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)))
}
