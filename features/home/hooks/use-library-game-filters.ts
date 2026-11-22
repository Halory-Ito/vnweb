import { useMemo, useState } from 'react'

import {
  getLibraryFolderKeys,
  getLibraryFolderTitle,
  matchesLibraryGameSearch,
} from '../lib/library-grouping'

import type { GameCardListItem, GameStatusNames } from '@/types'

export function useLibraryGameFilters<Game extends GameCardListItem>(
  games: Game[],
  keyword: string,
  statusNames?: GameStatusNames,
) {
  const [status, setStatus] = useState('')
  const [developer, setDeveloper] = useState('')

  const options = useMemo(() => {
    const statusKeys = new Set<string>()
    const developerKeys = new Set<string>()
    for (const game of games) {
      for (const key of getLibraryFolderKeys(game, 'status', statusNames)) statusKeys.add(key)
      for (const key of getLibraryFolderKeys(game, 'developer')) developerKeys.add(key)
    }

    return {
      status: [...statusKeys]
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => ({
          value: key,
          label: getLibraryFolderTitle('status', key, statusNames),
        })),
      developer: [...developerKeys]
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({
          value: `developer:${key}`,
          label: getLibraryFolderTitle('developer', key),
        })),
    }
  }, [games, statusNames])

  const activeStatus = options.status.some(({ value }) => value === status) ? status : ''
  const activeDeveloper = options.developer.some(({ value }) => value === developer)
    ? developer
    : ''
  const activeCount = Number(Boolean(activeStatus)) + Number(Boolean(activeDeveloper))
  const filteredGames = useMemo(() => {
    if (!keyword && !activeStatus && !activeDeveloper) return games

    return games.filter(
      (game) =>
        (!keyword || matchesLibraryGameSearch(game, keyword)) &&
        (!activeStatus ||
          getLibraryFolderKeys(game, 'status', statusNames).includes(activeStatus)) &&
        (!activeDeveloper ||
          getLibraryFolderKeys(game, 'developer').includes(
            activeDeveloper.slice('developer:'.length),
          )),
    )
  }, [activeDeveloper, activeStatus, games, keyword, statusNames])

  return {
    filteredGames,
    activeCount,
    isSearching: Boolean(keyword),
    fields: [
      { label: '游玩状态', value: activeStatus, options: options.status, onChange: setStatus },
      {
        label: '开发商',
        value: activeDeveloper,
        options: options.developer,
        onChange: setDeveloper,
      },
    ],
  }
}
