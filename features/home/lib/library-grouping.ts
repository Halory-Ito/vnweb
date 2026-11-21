import { getGamePlayStatusLabel, normalizeGamePlayStatus } from '@/features/game/lib/game-status'

import type { GameCardListItem } from '@/types'

export const LIBRARY_GROUP_LABELS = {
  status: '游玩状态',
  developer: '开发商',
  publisher: '发行商',
} as const

export type LibraryGroup = keyof typeof LIBRARY_GROUP_LABELS

export function getLibraryGroup(value: unknown): LibraryGroup {
  return value === 'developer' || value === 'publisher' ? value : 'status'
}

export function getLibraryFolderKeys(game: GameCardListItem, group: LibraryGroup): string[] {
  if (group === 'status') return [String(normalizeGamePlayStatus(game.status))]

  const names = new Set(
    (game[group] ?? '')
      .split(/[,，、;；]+/)
      .map((name) => name.trim())
      .filter(Boolean),
  )
  return names.size ? [...names] : ['']
}

export function getLibraryFolderTitle(group: LibraryGroup, key: string) {
  if (group === 'status') return getGamePlayStatusLabel(Number(key))
  return key || `未知${LIBRARY_GROUP_LABELS[group]}`
}

export function getLibraryFolderHref(group: LibraryGroup, key?: string) {
  const params = new URLSearchParams()
  if (group !== 'status') params.set('group', group)
  if (key !== undefined) params.set(group === 'status' ? 'status' : 'folder', key)
  const query = params.toString()
  return query ? `/game/home?${query}` : '/game/home'
}
