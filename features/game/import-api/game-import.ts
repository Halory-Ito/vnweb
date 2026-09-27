import { getBGMGameInfoByIdApi, searchBGMSubjectsApi } from './bangumi'
import { getSteamGameInfoByIdApi, searchSteamGamesByNameApi } from './steam'
import { getSGDBGameByIdApi, searchSGDBGamesApi } from './steamgriddb'
import { getVndbGameInfoByIdApi, searchVndbGamesApi } from './vndb'
import { getProviderById } from '@/lib/providers'
import { api } from '@/lib/request-utils'

import type { GameSearchResult } from './types'
import type { GameInfo } from '@/types/game'

export const getGameInfoByIdApi = async (id: string, provider: string) => {
  // 优先通过插件注册中心分发
  const plugin = getProviderById(provider)
  if (plugin?.type === 'provider' && plugin.getById) {
    return plugin.getById(id)
  }

  // 兼容旧逻辑
  if (provider === 'bangumi') {
    return getBGMGameInfoByIdApi(id)
  }
  if (provider === 'vndb') {
    return getVndbGameInfoByIdApi(id)
  }
  if (provider === 'steam') {
    return getSteamGameInfoByIdApi(id)
  }
  if (provider === 'steamgriddb') {
    return getSGDBGameByIdApi(id)
  }
  return null
}

export const searchGameByNameApi = async (
  keyword: string,
  provider: string,
  offset: number = 0,
  limit: number = 10,
) => {
  // 优先通过插件注册中心分发
  const plugin = getProviderById(provider)
  if (plugin?.type === 'provider' && plugin.searchByName) {
    return plugin.searchByName(keyword, offset, limit)
  }

  // 兼容旧逻辑
  if (provider === 'bangumi') {
    return searchBGMSubjectsApi(keyword, offset, limit)
  }

  if (provider === 'vndb') {
    return searchVndbGamesApi(keyword, offset, limit)
  }

  if (provider === 'steamgriddb') {
    const result = await searchSGDBGamesApi(keyword)
    return {
      total: result.total,
      items: result.items.slice(offset, offset + limit),
    } satisfies GameSearchResult
  }

  if (provider === 'steam') {
    return searchSteamGamesByNameApi(keyword, offset, limit)
  }

  return {
    total: 0,
    items: [],
  } as GameSearchResult
}

export const createGameInfoApi = async (
  gameInfo: GameInfo,
  sourceMap?: {
    provider: string
    externalId: string
  },
) => {
  const res = await api.request({
    method: 'POST',
    url: '/game',
    data: {
      ...gameInfo,
      sourceMap,
    },
  })
  return res.data as { data: { id?: number } }
}
