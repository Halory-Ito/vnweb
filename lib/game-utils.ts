import { api } from '@/lib/request-utils'

import type { GameFilterState, GameSidebarProps } from '@/types/game-types'

export type GameDetail = {
  id: number
  date: string
  cover: string
  icon: string
  logo: string
  bg: string
  summary: string
  name: string
  nameCn: string
  tags: string[]
  nsfw: boolean
  ailases: string[]
  platforms: string[]
  gameType: string
  gameEngine: string
  music: string
  script: string
  graphic: string
  originalPainter: string
  animationProduction: string
  developer: string
  publisher: string
  programmer: string
  createdAt: string | null
  updatedAt: string | null
  exePath: string
  totalPlayTime: number
  playCount: number
  rating: number
  lastLaunchedAt: string
  playStatus: number
  isRunning: boolean
  currentSessionSeconds: number
  websites: Array<{
    id: number
    name: string
    url: string
  }>
}

export type GameRuntime = {
  isRunning: boolean
  currentSessionSeconds: number
}

export const getGameFilterOptions = async () => {
  const response = await api.get('/game/filter-options')
  return (
    response.data as {
      data: {
        releaseDates: string[]
        developers: string[]
        publishers: string[]
        categories: string[]
        platforms: string[]
        tags: string[]
        originalPainters: string[]
        scripts: string[]
        musics: string[]
        engines: string[]
        plannings: string[]
      }
    }
  ).data
}

export type GameTimerRecordItem = {
  id: number
  startAt: string
  endAt: string
  durationSeconds: number
}

export type CollectionGameItem = {
  linkId: number
  id: number
  name: string
  cover: string
  icon: string
  date: string
  addedAt: string
  lastRunAt: string
  playTime: number
  rating: number
}

export type CollectionItem = {
  id: number
  name: string
  createdAt: string | null
  updatedAt: string | null
  firstGameCover: string
  games: CollectionGameItem[]
}

export type GameCardListItem = {
  id: string
  title: string
  cover: string
  publishAt: string
  lastRunAt: string
  addedAt: string
  playTime: number
  rating: number
}

export const getGameById = async (id: string) => {
  const response = await api.get(`/game/${id}`)
  return (response.data as { data: GameDetail }).data
}

export const getGameRuntimeById = async (id: number) => {
  const response = await api.get(`/game/${id}/runtime`)
  return (response.data as { data: GameRuntime }).data
}

export const launchGameById = async (id: number, exePath?: string) => {
  const response = await api.post(`/game/${id}/launch`, {
    exePath,
  })
  return response.data as {
    data: {
      exePath: string
      iconPath: string
    }
  }
}

export const stopGameById = async (id: number) => {
  const response = await api.post(`/game/${id}/stop`)
  return response.data as {
    data: {
      stopped: boolean
    }
  }
}

export const updateGamePlayStatusById = async (id: number, status: number) => {
  const response = await api.patch(`/game/${id}`, {
    status,
  })
  return response.data as {
    data: {
      status: number
    }
  }
}

export const getGameTimerRecordsById = async (id: number) => {
  const response = await api.get(`/game/${id}/records`)
  return (
    response.data as {
      data: {
        records: GameTimerRecordItem[]
        totalPlayTime: number
      }
    }
  ).data
}

export const updateGameTimerRecordsById = async (
  id: number,
  payload: {
    records: Array<{
      startAt: string
      endAt: string
    }>
  },
) => {
  const response = await api.put(`/game/${id}/records`, payload)
  return (
    response.data as {
      data: {
        updated: boolean
        totalPlayTime: number
      }
    }
  ).data
}

export const updateGameRatingById = async (id: number, rating: number) => {
  const response = await api.patch(`/game/${id}`, {
    rating,
  })
  return response.data as {
    data: {
      rating: number
    }
  }
}

export const deleteGameById = async (id: number) => {
  const response = await api.delete(`/game/${id}`)
  return response.data as {
    data: {
      deleted: boolean
      id: number
    }
  }
}

export const browseLocalFileByGameId = async (id: number) => {
  const response = await api.post(`/game/${id}/browse-local`)
  return response.data as {
    data: {
      opened: boolean
      exePath: string
    }
  }
}

export const updateGameSettingsById = async (
  id: number,
  payload: {
    exePath: string
    cover: string
    bg: string
    icon: string
    logo: string
  },
) => {
  const response = await api.patch(`/game/${id}`, payload)
  return response.data as {
    data: {
      updated: boolean
    }
  }
}

export const updateGameInfoById = async (
  id: number,
  payload: Partial<{
    date: string
    cover: string
    summary: string
    name: string
    nameCn: string
    tags: string[]
    nsfw: boolean
    ailases: string[]
    platforms: string[]
    gameType: string
    gameEngine: string
    music: string
    script: string
    graphic: string
    originalPainter: string
    animationProduction: string
    developer: string
    publisher: string
    programmer: string
  }>,
) => {
  const response = await api.patch(`/game/${id}`, payload)
  return response.data as {
    data: {
      updated: boolean
    }
  }
}

export type GameSearchImageItem = {
  id: number
  url: string
  thumb: string
  width: number
  height: number
}

export const searchGameImages = async (payload: {
  source: string
  keyword: string
  imageType: 'cover' | 'bg' | 'icon' | 'logo'
}) => {
  const response = await api.post('/game/image-search', payload)
  return response.data as {
    data: {
      game: {
        id: number
        name: string
      } | null
      items: GameSearchImageItem[]
    }
  }
}

export const getCollections = async () => {
  const response = await api.get('/collection')
  return (response.data as { data: CollectionItem[] }).data
}

export const createCollection = async (name: string) => {
  const response = await api.post('/collection', { name })
  return (response.data as { data: { id: number; name: string } }).data
}

export const addGameToCollection = async (
  collectionId: number,
  gameId: number,
) => {
  const response = await api.post(`/collection/${collectionId}/game`, {
    gameId,
  })
  return response.data as {
    data: {
      collectionId: number
      gameId: number
      added: boolean
    }
  }
}

export const removeGameFromCollection = async (
  collectionId: number,
  gameId: number,
) => {
  const response = await api.delete(`/collection/${collectionId}/game`, {
    params: { gameId },
  })
  return response.data as {
    data: {
      collectionId: number
      gameId: number
      removed: boolean
    }
  }
}

export const moveGameToCollection = async (
  sourceCollectionId: number,
  gameId: number,
  targetCollectionId: number,
) => {
  const response = await api.patch(`/collection/${sourceCollectionId}/game`, {
    gameId,
    targetCollectionId,
  })
  return response.data as {
    data: {
      gameId: number
      sourceCollectionId: number
      targetCollectionId: number
      moved: boolean
    }
  }
}

export const getGameCardList = async () => {
  const response = await api.get('/game/list')
  return (response.data as { data: GameCardListItem[] }).data
}

export const batchUpdateGameMetadata = async (payload: {
  gameIds: number[]
  provider: 'bangumi' | 'steamgriddb'
  query?: string
  fields: Array<
    | 'date'
    | 'cover'
    | 'icon'
    | 'logo'
    | 'bg'
    | 'summary'
    | 'name'
    | 'nameCn'
    | 'tags'
    | 'nsfw'
    | 'ailases'
    | 'platforms'
    | 'gameType'
    | 'gameEngine'
    | 'music'
    | 'script'
    | 'graphic'
    | 'originalPainter'
    | 'animationProduction'
    | 'developer'
    | 'publisher'
    | 'programmer'
  >
  strategy: 'replace' | 'merge' | 'append'
}) => {
  const response = await api.post('/game/metadata-batch', payload)
  return response.data as {
    data: {
      updatedCount: number
      skippedCount: number
      failedCount: number
    }
  }
}

export const getGameSidebarData = async (payload: {
  search: string
  filter: GameFilterState
}) => {
  const params = new URLSearchParams()
  params.set('search', payload.search)

  params.set('releaseDateFrom', payload.filter.releaseDateFrom)
  params.set('releaseDateTo', payload.filter.releaseDateTo)
  params.set('playStatus', payload.filter.playStatus)
  params.set('developer', payload.filter.developer)
  params.set('publisher', payload.filter.publisher)
  params.set('category', payload.filter.category)
  params.set('platform', payload.filter.platform)
  params.set('tags', payload.filter.tags)
  params.set('originalPainter', payload.filter.originalPainter)
  params.set('script', payload.filter.script)
  params.set('music', payload.filter.music)
  params.set('engine', payload.filter.engine)
  params.set('planning', payload.filter.planning)

  const response = await api.get(`/game/sidebar?${params.toString()}`)
  return (
    response.data as {
      data: {
        mode: 'search' | 'default'
        items: GameSidebarProps[]
      }
    }
  ).data
}
