import { api } from '@/lib/request-utils'

import type {
  CharacterMergeStrategy,
  CharacterSyncSource,
  VndbCharacterDetail,
  VndbCharacterListItem,
} from '@/types/character'

export const getVndbCharactersByGameId = async (gameId: number) => {
  const response = await api.get('/db/vndb/characters', {
    params: {
      gameId,
    },
  })
  return (
    response.data as {
      data: {
        vnId: string
        bgmSubjectId: string
        items: VndbCharacterListItem[]
      }
    }
  ).data
}

export const syncVndbCharactersByGameId = async (
  gameId: number,
  options?: {
    source?: CharacterSyncSource
    mergeStrategy?: CharacterMergeStrategy
    saveImagesToLocal?: boolean
  },
) => {
  const response = await api.post('/db/vndb/characters', {
    gameId,
    source: options?.source,
    mergeStrategy: options?.mergeStrategy,
    saveImagesToLocal: options?.saveImagesToLocal,
  })
  return (
    response.data as {
      data: {
        gameId: number
        vnId: string
        bgmSubjectId: string
        total: number
        inserted: number
        updated: number
      }
    }
  ).data
}

export const clearVndbCharactersByGameId = async (gameId: number) => {
  const response = await api.delete('/db/vndb/characters', {
    params: {
      gameId,
    },
  })
  return (
    response.data as {
      data: {
        gameId: number
        cleared: boolean
      }
    }
  ).data
}

export const localizeCharacterImages = async (gameId: number) => {
  const response = await api.post('/db/vndb/characters/localize-images', {
    gameId,
  })
  return (
    response.data as {
      data: {
        total: number
        localized: number
        skipped: number
        failed: number
      }
    }
  ).data
}

export const getVndbCharacterById = async (characterId: string, gameId?: number) => {
  const response = await api.get(`/db/vndb/character/${characterId}`, {
    params: gameId ? { gameId } : undefined,
  })
  return (response.data as { data: VndbCharacterDetail }).data
}

export const updateVndbCharacterById = async (
  characterId: string,
  payload: {
    gameId: number
    name: string
    original: string
    description: string
    imageUrl: string
    bloodType: string
    height: number | null
    weight: number | null
    bust: number | null
    waist: number | null
    hips: number | null
    age: number | null
    birthday: [number, number] | null
    sex: [string | null, string | null] | null
    gender: [string | null, string | null] | null
  },
) => {
  const response = await api.patch(`/db/vndb/character/${characterId}`, payload)
  return (response.data as { data: { updated: boolean } }).data
}
