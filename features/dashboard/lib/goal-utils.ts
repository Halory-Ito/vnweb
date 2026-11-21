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
  if (current >= target) return 100
  return Math.min(99, Math.max(0, Math.round((current / target) * 100)))
}

export function getGoalProgressColor(percent: number) {
  if (percent >= 100) return 'text-emerald-600 dark:text-emerald-400'
  if (percent >= 75) return 'text-sky-600 dark:text-sky-400'
  if (percent >= 50) return 'text-amber-600 dark:text-amber-400'
  if (percent > 0) return 'text-rose-600 dark:text-rose-400'
  return 'text-muted-foreground'
}
