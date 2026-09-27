import { api } from '@/lib/request-utils'

import type { GameSearchItem, GameSearchResult } from './types'
import type { GameInfo } from '@/types/game'

type SGDBGame = {
  id?: number
  name?: string
  release_date?: number
}

type SGDBImage = {
  url?: string
}

type SGDBGameDetailResponse = {
  data?: {
    game?: SGDBGame
    grids?: SGDBImage[]
  }
}

type SGDBSearchResponse = {
  data?: SGDBGame[]
  total?: number
}

export const searchSGDBGamesApi = async (keyword: string) => {
  const res = await api.request({
    method: 'POST',
    url: '/db/sgdb',
    data: {
      keyword,
    },
  })

  const payload = res.data as SGDBSearchResponse
  const games = payload.data ?? []

  return {
    total: payload.total ?? games.length,
    items: games
      .map((game) => {
        if (game.id === undefined || game.id === null) {
          return null
        }

        const date =
          typeof game.release_date === 'number' && game.release_date > 0
            ? new Date(game.release_date * 1000).toISOString().slice(0, 10)
            : ''

        return {
          id: String(game.id),
          name: game.name ?? '',
          developer: 'SteamGrid DB',
          date,
        }
      })
      .filter((item): item is GameSearchItem => item !== null),
  } satisfies GameSearchResult
}

export const getSGDBGameByIdApi = async (id: string) => {
  const res = await api.request({
    method: 'GET',
    url: '/db/sgdb',
    params: {
      id,
    },
  })

  const payload = res.data as SGDBGameDetailResponse
  const game = payload.data?.game
  const grids = payload.data?.grids ?? []
  const cover = grids[0]?.url ?? ''
  const releaseDate =
    typeof game?.release_date === 'number' && game.release_date > 0
      ? new Date(game.release_date * 1000).toISOString().slice(0, 10)
      : ''

  return {
    date: releaseDate,
    cover,
    summary: '',
    name: game?.name ?? '',
    nameCn: game?.name ?? '',
    tags: [],
    nsfw: false,
    ailases: [],
    platforms: [],
    gameType: '',
    gameEngine: '',
    websites: [],
    links: [],
    music: '',
    script: '',
    graphic: '',
    originalPainter: '',
    animationProduction: '',
    developer: '',
    publisher: '',
    programmer: '',
  } satisfies GameInfo
}
