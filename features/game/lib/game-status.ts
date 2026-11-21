import type { GameStatusNames } from '@/types/game'

export type { GameStatusNames } from '@/types/game'

// 既有游戏库使用的初始状态。
export const GAME_PLAY_STATUS_OPTIONS = [0, 1, 2, 3, 4, 5] as const

export type GamePlayStatus = number
export const UNKNOWN_GAME_STATUS = -1
export const GAME_STATUS_NAME_MAX_LENGTH = 24

export const gamePlayStatusLabelMap: GameStatusNames = {
  0: '未开始',
  1: '游玩中',
  2: '部分完成',
  3: '已完成',
  4: '多周目',
  5: '搁置中',
}

// 状态指示点颜色默认值由 `lib/settings/status-settings.ts` 提供，可在「设置 - 外观」中自定义

export function normalizeGamePlayStatus(status?: number | null, names = gamePlayStatusLabelMap) {
  const value = status ?? 0
  return Object.hasOwn(names, value) ? value : UNKNOWN_GAME_STATUS
}

export function normalizeGameStatusNames(input: unknown): GameStatusNames {
  const names = { ...gamePlayStatusLabelMap }
  if (!input || typeof input !== 'object') return names

  for (const status of GAME_PLAY_STATUS_OPTIONS) {
    const name = (input as Partial<Record<GamePlayStatus, unknown>>)[status]
    if (typeof name === 'string' && name.trim()) {
      names[status] = name.trim().slice(0, GAME_STATUS_NAME_MAX_LENGTH)
    }
  }
  return names
}

export const getGamePlayStatusLabel = (status?: number | null, names = gamePlayStatusLabelMap) =>
  names[normalizeGamePlayStatus(status, names)] ?? '未知'

export const getGamePlayStatusOptions = (names = gamePlayStatusLabelMap) =>
  Object.entries(names).map(([status, label]) => ({
    value: Number(status),
    label,
  }))
