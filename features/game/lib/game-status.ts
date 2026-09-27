// 游戏游玩状态的统一定义，与 GamePlayTable.status 字段一一对应
export const GAME_PLAY_STATUS_OPTIONS = [0, 1, 2, 3, 4, 5] as const

export type GamePlayStatus = (typeof GAME_PLAY_STATUS_OPTIONS)[number]

export const gamePlayStatusLabelMap: Record<number, string> = {
  0: '未开始',
  1: '游玩中',
  2: '部分完成',
  3: '已完成',
  4: '多周目',
  5: '搁置中',
}

// 状态指示点颜色默认值由 `lib/settings/status-settings.ts` 提供，可在「设置 - 外观」中自定义

const normalizeStatus = (status?: number | null) => {
  const value = Number(status)
  return gamePlayStatusLabelMap[value] ? value : 0
}

export const getGamePlayStatusLabel = (status?: number | null) =>
  gamePlayStatusLabelMap[normalizeStatus(status)]

export const getGamePlayStatusOptions = () =>
  GAME_PLAY_STATUS_OPTIONS.map((status) => ({
    value: status,
    label: gamePlayStatusLabelMap[status],
  }))
