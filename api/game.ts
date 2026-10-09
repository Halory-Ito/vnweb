import { api } from '@/lib/request-utils'

import type {
  GameCardListItem,
  GameDetail,
  GameFilterState,
  GameRuntime,
  GameSearchImageItem,
  GameSidebarProps,
  GameTimerRecordItem,
} from '@/types/game'

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

export const browseLocalFileByGameId = async (id: number, mode: 'game' | 'save' = 'game') => {
  const response = await api.post(`/game/${id}/browse-local`, { mode })
  return response.data as {
    data: {
      opened: boolean
      path: string
    }
  }
}

export const updateGameSettingsById = async (
  id: number,
  payload: {
    exePath: string
    saveDir?: string
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

export const enqueueGameImageLocalizationById = async (
  id: number,
  payload: {
    imageType: 'cover' | 'bg' | 'icon' | 'logo'
    sourceUrl: string
  },
) => {
  const response = await api.post(`/game/${id}/image-localize`, payload)
  return response.data as {
    data: {
      path: string
    }
  }
}

export const updateGameInfoById = async (
  id: number,
  payload: Partial<{
    date: string
    cover: string
    bg: string
    icon: string
    logo: string
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
    externalSourceIds: string
  }>,
) => {
  const response = await api.patch(`/game/${id}`, payload)
  return response.data as {
    data: {
      updated: boolean
    }
  }
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

export const getGameCardList = async (payload?: { includeNsfw?: boolean }) => {
  const includeNsfw = payload?.includeNsfw ?? true
  const response = await api.get('/game/list', {
    params: {
      includeNsfw,
    },
  })
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
  includeNsfw?: boolean
}) => {
  const params = new URLSearchParams()
  const includeNsfw = payload.includeNsfw ?? true
  params.set('search', payload.search)
  params.set('includeNsfw', String(includeNsfw))
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

export const batchMarkNsfw = async (gameIds: string[], nsfw: boolean) => {
  const response = await api.post('/game/batch-nsfw', {
    gameIds,
    nsfw,
  })
  return response.data as {
    data: {
      success: boolean
      updatedCount: number
    }
  }
}

export const mergeGames = async (sourceIds: string[], targetId: string) => {
  const response = await api.post('/game/merge', {
    sourceIds,
    targetId,
  })
  return response.data as {
    data: {
      success: boolean
      mergedCount: number
      targetId: number
    }
  }
}
