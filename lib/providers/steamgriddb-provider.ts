import { api } from '@/lib/request-utils'

import type { GameProviderPlugin, GameSearchResult } from './types'
import type { GameInfo } from '@/types/game-types'

// ── SGDB 响应类型 ─────────────────────────────────────────
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

// ── 插件定义 ──────────────────────────────────────────────
export const steamgriddbProvider: GameProviderPlugin = {
  id: 'steamgriddb',
  name: 'SteamGrid DB',
  description: 'SteamGrid DB 游戏封面图库，可用于补充游戏封面',
  icon: 'Image',
  version: '1.0.0',
  capabilities: ['manual-search'],
  defaultEnabled: true,

  searchByName: async (
    keyword: string,
    _offset: number,
    limit: number,
  ): Promise<GameSearchResult> => {
    const res = await api.request({
      method: 'POST',
      url: '/db/sgdb',
      data: { keyword },
    })

    const payload = res.data as SGDBSearchResponse
    const games = payload.data ?? []
    const allItems = games
      .map((game) => {
        if (game.id === undefined || game.id === null) return null
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
      .filter(
        (item): item is { id: string; name: string; developer: string; date: string } =>
          item !== null,
      )

    return {
      total: payload.total ?? allItems.length,
      items: allItems.slice(0, limit),
    }
  },

  getById: async (id: string): Promise<GameInfo | null> => {
    const res = await api.request({
      method: 'GET',
      url: '/db/sgdb',
      params: { id },
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
    }
  },
}
