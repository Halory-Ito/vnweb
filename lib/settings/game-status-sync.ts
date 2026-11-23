import type { GameStatusPushColors, GameStatusPushState } from '@/types'

export const GAME_STATUS_SYNC_OPTIONS = {
  bangumi: [
    { value: 1, label: '想玩' },
    { value: 2, label: '玩过' },
    { value: 3, label: '在玩' },
    { value: 4, label: '搁置' },
    { value: 5, label: '抛弃' },
  ],
  vndb: [
    { value: 1, label: 'Playing' },
    { value: 2, label: 'Finished' },
    { value: 3, label: 'Stalled' },
    { value: 4, label: 'Dropped' },
    { value: 5, label: 'Wishlist' },
  ],
} as const

export const GAME_STATUS_SYNC_LABELS = { bangumi: 'Bangumi', vndb: 'VNDB' } as const

export const GAME_STATUS_SYNC_PROVIDERS = ['bangumi', 'vndb'] as const

export const GAME_STATUS_PUSH_LABELS: Record<GameStatusPushState, string> = {
  unavailable: '不具备推送条件',
  unsynced: '未同步',
  pushed: '已推送',
  pending: '待同步',
}

export const DEFAULT_GAME_STATUS_PUSH_COLORS: GameStatusPushColors = {
  unavailable: '#a1a1aa',
  unsynced: '#60a5fa',
  pushed: '#22c55e',
  pending: '#f59e0b',
}

export const GAME_STATUS_PUSH_STATES = Object.keys(
  DEFAULT_GAME_STATUS_PUSH_COLORS,
) as GameStatusPushState[]
