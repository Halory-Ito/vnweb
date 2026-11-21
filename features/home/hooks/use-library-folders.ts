import {
  getLibraryFolderHref,
  getLibraryFolderKeys,
  getLibraryFolderTitle,
} from '../lib/library-grouping'
import { GAME_PLAY_STATUS_OPTIONS } from '@/features/game/lib/game-status'

import type { LibraryGroup } from '../lib/library-grouping'
import type { GameCardsData } from '../views/game-home'
import type { CollectionItem } from '@/types'

export function useLibraryFolders(
  games: GameCardsData,
  collections: CollectionItem[],
  groupBy: LibraryGroup,
) {
  const gamesById = new Map(games.map((game) => [game.id, game]))
  const groups = new Map<string, GameCardsData>()

  for (const game of games) {
    for (const key of getLibraryFolderKeys(game, groupBy)) {
      const group = groups.get(key) ?? []
      group.push(game)
      groups.set(key, group)
    }
  }

  const keys =
    groupBy === 'status'
      ? GAME_PLAY_STATUS_OPTIONS.map(String)
      : [...groups.keys()].sort((a, b) => {
          if (!a || !b) return Number(!a) - Number(!b)
          return a.localeCompare(b, 'zh-CN')
        })

  return {
    groupedFolders: keys.map((key) => ({
      title: getLibraryFolderTitle(groupBy, key),
      href: getLibraryFolderHref(groupBy, key),
      games: groups.get(key) ?? [],
      canSetLogo: groupBy === 'developer' && key !== '',
    })),
    customFolders: collections.map((collection) => ({
      id: collection.id,
      title: collection.name,
      href: `/game/collection/${collection.id}`,
      games: collection.games.flatMap(({ id }) => {
        const game = gamesById.get(String(id))
        return game ? [game] : []
      }),
    })),
  }
}
