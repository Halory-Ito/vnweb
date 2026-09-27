import { api } from '@/lib/request-utils'

import type { GameSearchResult, SteamOwnedGameItem } from './types'
import type { GameInfo } from '@/types/game'

export const getSteamGameInfoByIdApi = async (id: string) => {
  const res = await api.request({
    method: 'GET',
    url: '/game/steam-import/name-search',
    params: {
      id,
    },
  })
  return (res.data as { data: GameInfo }).data
}

export const searchSteamGamesByNameApi = async (
  keyword: string,
  offset: number = 0,
  limit: number = 10,
) => {
  const res = await api.request({
    method: 'POST',
    url: '/game/steam-import/name-search',
    data: {
      keyword,
      offset,
      limit,
    },
  })

  return (res.data as { data: GameSearchResult }).data
}

export const searchSteamOwnedGamesApi = async (steamId: string) => {
  const res = await api.request({
    method: 'POST',
    url: '/game/steam-import/search',
    timeout: 10 * 60 * 1000,
    data: {
      steamId,
    },
  })

  return res.data as {
    data: {
      total: number
      items: SteamOwnedGameItem[]
    }
  }
}

export const importSteamGameApi = async (payload: {
  steamId: string
  appid: number
  name: string
  playtimeMinutes: number
  coverUrl: string
  iconUrl: string
  logoUrl: string
}) => {
  const res = await api.request({
    method: 'POST',
    url: '/game/steam-import',
    timeout: 10 * 60 * 1000,
    data: payload,
  })

  return res.data as {
    data: {
      appid: number
      status: 'imported' | 'skipped'
      reason?: string
      playtimeSeconds?: number
    }
  }
}
