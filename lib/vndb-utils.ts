import { api } from '@/lib/request-utils'
import { getProviderById } from '@/lib/providers'

import type { GameInfo } from '@/types/game-types'

type BGMInfoboxItem = {
  key: string
  value: string | Array<{ k?: string; v: string }>
}

type BGMSubject = {
  id?: number
  date?: string
  images?: {
    large?: string
  }
  summary?: string
  name?: string
  name_cn?: string
  tags?: Array<{
    name?: string
  }>
  nsfw?: boolean
  infobox?: BGMInfoboxItem[]
}

type BGMSearchResponse = {
  total?: number
  limit?: number
  offset?: number
  data?: BGMSubject[]
}

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

type VndbSearchResultItem = {
  id?: string
  title?: string
  alttitle?: string | null
  released?: string | null
  developers?: Array<{
    name?: string
  }>
}

type VndbSearchResponse = {
  results?: VndbSearchResultItem[]
  count?: number
}

type VndbDetailResponse = {
  id?: string
  title?: string
  alttitle?: string | null
  aliases?: string[]
  released?: string | null
  image?: {
    url?: string
  } | null
  description?: string | null
  tags?: Array<{
    name?: string
  }>
  developers?: Array<{
    name?: string
  }>
  platforms?: string[]
  extlinks?: Array<{
    label?: string
    url?: string
  }>
}

export type GameSearchItem = {
  id: string
  name: string
  developer: string
  date: string
}

export type GameSearchResult = {
  total: number
  items: GameSearchItem[]
}

const toInfoboxTextList = (
  value: BGMInfoboxItem['value'] | undefined,
): string[] => {
  if (!value) {
    return []
  }
  if (typeof value === 'string') {
    return value ? [value] : []
  }
  return value.map((item) => item.v).filter(Boolean)
}

const toInfoboxRecordList = (
  value: BGMInfoboxItem['value'] | undefined,
): Record<string, string>[] => {
  if (!value) {
    return []
  }
  if (typeof value === 'string') {
    return []
  }
  return value
    .map((item) => {
      if (!item.v) {
        return null
      }
      return {
        [item.k ?? 'default']: item.v,
      }
    })
    .filter((item): item is Record<string, string> => item !== null)
}

const getInfoboxItem = (
  infobox: BGMInfoboxItem[] | undefined,
  keys: string[],
) => {
  if (!infobox?.length) {
    return undefined
  }
  return infobox.find((item) => keys.includes(item.key))
}

const getInfoboxValueText = (
  infobox: BGMInfoboxItem[] | undefined,
  keys: string[],
) => {
  const item = getInfoboxItem(infobox, keys)
  return toInfoboxTextList(item?.value)[0] ?? ''
}

export const mapBGMSubjectToGameInfo = (subject: BGMSubject): GameInfo => {
  const infobox = subject.infobox ?? []

  const aliases = toInfoboxTextList(getInfoboxItem(infobox, ['别名'])?.value)

  const platforms = [
    ...toInfoboxTextList(getInfoboxItem(infobox, ['平台'])?.value),
    ...infobox
      .map((item) =>
        item.key.startsWith('平台:') ? item.key.replace('平台:', '') : '',
      )
      .filter(Boolean),
  ]

  return {
    date: subject.date ?? '',
    cover: subject.images?.large ?? '',
    summary: subject.summary ?? '',
    name: subject.name ?? '',
    nameCn: subject.name_cn ?? '',
    tags: (subject.tags ?? []).map((tag) => tag.name ?? '').filter(Boolean),
    nsfw: subject.nsfw ?? false,
    ailases: Array.from(new Set(aliases)),
    platforms: Array.from(new Set(platforms)),
    gameType: getInfoboxValueText(infobox, ['游戏类型']),
    gameEngine: getInfoboxValueText(infobox, ['游戏引擎']),
    websites: toInfoboxRecordList(getInfoboxItem(infobox, ['website'])?.value),
    links: toInfoboxRecordList(getInfoboxItem(infobox, ['链接'])?.value),
    music: getInfoboxValueText(infobox, ['音乐']),
    script: getInfoboxValueText(infobox, ['script', '剧本']),
    graphic: getInfoboxValueText(infobox, ['graphic']),
    originalPainter: getInfoboxValueText(infobox, ['原画']),
    animationProduction: getInfoboxValueText(infobox, ['动画制作']),
    developer: getInfoboxValueText(infobox, ['开发']),
    publisher: getInfoboxValueText(infobox, ['发行']),
    programmer: getInfoboxValueText(infobox, ['程序']),
  }
}
/**
 * BGM API Functions
 */

export const searchBGMSubjectsApi = async (
  keyword: string,
  offset: number = 0,
  limit: number = 10,
) => {
  const res = await api.request({
    method: 'POST',
    url: `/db/bgm?offset=${offset}&limit=${limit}`,
    data: {
      keyword,
      filter: {
        type: [4],
        // nsfw: true,
      },
    },
  })

  const payload = res.data as BGMSearchResponse
  const subjects = payload.data ?? []

  return {
    total: payload.total ?? subjects.length,
    items: subjects
      .map((subject) => {
        if (subject.id === undefined || subject.id === null) {
          return null
        }

        const developer = getInfoboxValueText(subject.infobox, [
          '开发',
          '开发商',
        ])

        return {
          id: String(subject.id),
          name: subject.name_cn || subject.name || '',
          developer,
          date: subject.date ?? '',
        }
      })
      .filter((item): item is GameSearchItem => item !== null),
  } satisfies GameSearchResult
}

export const getBGMSubjectByIdApi = async (id: string) => {
  const res = await api.request({
    method: 'GET',
    url: '/db/bgm',
    params: {
      id,
    },
  })
  return res.data
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

const mapVndbDetailToGameInfo = (entry: VndbDetailResponse): GameInfo => {
  const title = entry.title ?? ''
  const altTitle = entry.alttitle ?? ''
  const developers = (entry.developers ?? [])
    .map((item) => item.name ?? '')
    .filter(Boolean)
  const extlinks = (entry.extlinks ?? [])
    .map((item) => {
      const label = item.label?.trim() || ''
      const url = item.url?.trim() || ''

      if (!label || !url) {
        return null
      }

      return { [label]: url }
    })
    .filter((item): item is Record<string, string> => item !== null)

  return {
    date: entry.released ?? '',
    cover: entry.image?.url ?? '',
    summary: entry.description ?? '',
    name: title,
    nameCn: altTitle || title,
    tags: (entry.tags ?? []).map((tag) => tag.name ?? '').filter(Boolean),
    nsfw: false,
    ailases: Array.from(new Set((entry.aliases ?? []).filter(Boolean))),
    platforms: (entry.platforms ?? []).filter(Boolean),
    gameType: 'VNDB',
    gameEngine: '',
    websites: extlinks,
    links: [],
    music: '',
    script: '',
    graphic: '',
    originalPainter: '',
    animationProduction: '',
    developer: developers.join(', '),
    publisher: developers.join(', '),
    programmer: '',
  }
}

/**
 * Steam API Functions
 */

export const getGameInfoByIdApi = async (id: string, provider: string) => {
  // 优先通过插件注册中心分发
  const plugin = getProviderById(provider)
  if (plugin?.type === 'provider' && plugin.getById) {
    return plugin.getById(id)
  }

  // 兼容旧逻辑
  if (provider === 'bangumi') {
    const rawSubject = (await getBGMSubjectByIdApi(id)) as BGMSubject
    return mapBGMSubjectToGameInfo(rawSubject)
  }
  if (provider === 'vndb') {
    const res = await api.request({
      method: 'GET',
      url: '/db/vndb',
      params: {
        id,
      },
    })
    return mapVndbDetailToGameInfo(res.data as VndbDetailResponse)
  }
  if (provider === 'steam') {
    const res = await api.request({
      method: 'GET',
      url: '/game/steam-import/name-search',
      params: {
        id,
      },
    })
    return (res.data as { data: GameInfo }).data
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
    const res = await api.request({
      method: 'POST',
      url: `/db/vndb?offset=${offset}&limit=${limit}`,
      data: {
        keyword,
      },
    })

    const payload = res.data as VndbSearchResponse
    const items = (payload.results ?? [])
      .map((item) => ({
        id: item.id ?? '',
        name: item.alttitle || item.title || '',
        developer: (item.developers ?? [])
          .map((developer) => developer.name ?? '')
          .filter(Boolean)
          .join(', '),
        date: item.released ?? '',
      }))
      .filter((item) => item.id && item.name)

    return {
      total: payload.count ?? items.length,
      items,
    } satisfies GameSearchResult
  }

  if (provider === 'steamgriddb') {
    const result = await searchSGDBGamesApi(keyword)
    return {
      total: result.total,
      items: result.items.slice(offset, offset + limit),
    } satisfies GameSearchResult
  }

  if (provider === 'steam') {
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

export type SteamOwnedGameItem = {
  appid: number
  name: string
  playtimeMinutes: number
  coverUrl: string
  iconUrl: string
  logoUrl: string
  alreadyImported: boolean
}

export type ThirdPartyLibraryGameItem = {
  id: string
  name: string
  date: string
  coverUrl: string
  note: string
  alreadyImported: boolean
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

export const searchBangumiCollectedGamesApi = async () => {
  const res = await api.request({
    method: 'GET',
    url: '/game/bangumi-import/search',
    timeout: 10 * 60 * 1000,
  })

  return res.data as {
    data: {
      total: number
      items: ThirdPartyLibraryGameItem[]
    }
  }
}

export const searchVndbUserListApi = async () => {
  const res = await api.request({
    method: 'GET',
    url: '/game/vndb-import/search',
    timeout: 10 * 60 * 1000,
  })

  return res.data as {
    data: {
      total: number
      items: ThirdPartyLibraryGameItem[]
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
