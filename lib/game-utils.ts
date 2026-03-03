import { api } from '@/lib/request-utils'

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

export const addGameToCollection = async (collectionId: number, gameId: number) => {
  const response = await api.post(`/collection/${collectionId}/game`, { gameId })
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
