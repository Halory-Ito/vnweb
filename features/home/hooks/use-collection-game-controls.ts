import { useMemo } from 'react'

import { useLibraryGameFilters } from './use-library-game-filters'
import { useLibraryGameSort } from './use-library-game-sort'
import { useGameStatusNames } from '@/features/game/hooks/use-game-status-names'

import type { CollectionItem } from '@/types'

export function useCollectionGameControls(
  collection: CollectionItem | undefined,
  showNsfw: boolean,
) {
  const { data: statusNames } = useGameStatusNames()
  const games = useMemo(
    () =>
      (collection?.games ?? [])
        .filter((game) => showNsfw || !game.nsfw)
        .map((game) => ({
          ...game,
          id: String(game.id),
          title: game.nameCn || game.name,
          publishAt: game.date,
          game,
        })),
    [collection, showNsfw],
  )
  const filters = useLibraryGameFilters(games, '', statusNames)
  const { items, ...sortControls } = useLibraryGameSort(filters.filteredGames, 'add_date', 'asc')
  const gameIds = useMemo(() => filters.filteredGames.map(({ id }) => id), [filters.filteredGames])

  return { filters, sortControls, items, gameIds, hasGames: games.length > 0 }
}
