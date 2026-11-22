import { getGamePlayStatusLabel, normalizeGamePlayStatus } from '@/features/game/lib/game-status'
import {
  ADDITIONAL_GAME_METADATA_FIELDS,
  BASIC_GAME_METADATA_FIELDS,
} from '@/lib/game-metadata-fields'

import type { GameStatusNames } from '@/features/game/lib/game-status'
import type { LayoutLibraryGroup } from '@/lib/settings/layout-settings'
import type { GameCardListItem } from '@/types'

export const LIBRARY_GROUP_LABELS = {
  status: '游玩状态',
  ...BASIC_GAME_METADATA_FIELDS,
  ...ADDITIONAL_GAME_METADATA_FIELDS,
} satisfies Record<LayoutLibraryGroup, string>

export type LibraryGroup = keyof typeof LIBRARY_GROUP_LABELS

export function matchesLibraryGameSearch(game: GameCardListItem, keyword: string) {
  return (
    game.title.toLowerCase().includes(keyword) ||
    (game.originalTitle?.toLowerCase().includes(keyword) ?? false) ||
    (game.tags?.some((tag) => tag.toLowerCase().includes(keyword)) ?? false) ||
    Object.values(game.searchMetadata ?? {}).some((value) => value.toLowerCase().includes(keyword))
  )
}

export function getLibraryFolderKeys(
  game: Pick<
    GameCardListItem,
    'status' | 'publishAt' | 'developer' | 'publisher' | 'searchMetadata'
  >,
  group: LibraryGroup,
  statusNames?: GameStatusNames,
): string[] {
  if (group === 'status') return [String(normalizeGamePlayStatus(game.status, statusNames))]
  if (group === 'date') return [game.searchMetadata?.date || game.publishAt || '']
  const isCompany = group === 'developer' || group === 'publisher'
  const value = isCompany ? game[group] : game.searchMetadata?.[group]
  const separator = isCompany ? /[,，、;；]+/ : /[,，、/;；&]+/

  const names = new Set(
    (value ?? '')
      .split(separator)
      .map((name) => name.trim())
      .filter(Boolean),
  )
  return names.size ? [...names] : ['']
}

export function getLibraryFolderTitle(
  group: LibraryGroup,
  key: string,
  statusNames?: GameStatusNames,
) {
  if (group === 'status') return getGamePlayStatusLabel(Number(key), statusNames)
  if (group === 'developer' || group === 'publisher')
    return key || `未知${LIBRARY_GROUP_LABELS[group]}`
  return key || '未分类'
}

export function getLibraryFolderHref(group: LibraryGroup, key?: string) {
  const params = new URLSearchParams()
  if (group !== 'status') params.set('group', group)
  if (key !== undefined) params.set(group === 'status' ? 'status' : 'folder', key)
  const query = params.toString()
  return query ? `/game/home?${query}` : '/game/home'
}
