import dayjs from 'dayjs'

import type { RecordPlayHeatmapDay } from '@/types'

/** 热力等级对应的透明度（叠加在图表颜色后），级别 1-4 */
export const HEATMAP_LEVEL_ALPHAS = ['33', '66', 'aa', 'ff']

/** 月份日历单元格：从周一开始，补齐首尾空位 */
export const buildMonthCells = (days: RecordPlayHeatmapDay[]) => {
  if (days.length === 0) {
    return []
  }

  const first = dayjs(days[0].date)
  const leading = (first.day() + 6) % 7
  const cells: Array<RecordPlayHeatmapDay | null> = [
    ...Array.from({ length: leading }, () => null),
    ...days,
  ]

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }
  return cells
}

/** 依据非零日时长的 25/50/75 分位数返回等级阈值 */
export const getHeatmapThresholds = (days: RecordPlayHeatmapDay[]) => {
  const values = days
    .filter((day) => day.seconds > 0)
    .map((day) => day.seconds)
    .sort((a, b) => a - b)

  if (values.length === 0) {
    return [0, 0, 0] as [number, number, number]
  }

  const pick = (percent: number) =>
    values[Math.min(values.length - 1, Math.floor(percent * (values.length - 1)))]

  return [pick(0.25), pick(0.5), pick(0.75)] as [number, number, number]
}

/** 每日时长等级：0 无记录，1-4 由浅到深 */
export const getHeatmapLevel = (seconds: number, thresholds: readonly [number, number, number]) => {
  if (seconds <= 0) {
    return 0
  }
  if (thresholds[2] <= thresholds[0]) {
    return 4
  }
  if (seconds <= thresholds[0]) {
    return 1
  }
  if (seconds <= thresholds[1]) {
    return 2
  }
  if (seconds <= thresholds[2]) {
    return 3
  }
  return 4
}

/** 当前连续游玩天数，今天尚未游玩时从昨天开始计算 */
export const calcCurrentStreak = (days: RecordPlayHeatmapDay[]) => {
  let streak = 0
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].seconds > 0) {
      streak += 1
      continue
    }
    if (index === days.length - 1) {
      continue
    }
    break
  }
  return streak
}
