import { api } from '@/lib/request-utils'

import type { CollectionItem } from '@/types/collection'

export const getCollections = async () => {
  const response = await api.get('/collection')
  return (response.data as { data: CollectionItem[] }).data
}

export const createCollection = async (name: string) => {
  const response = await api.post('/collection', { name })
  return (response.data as { data: { id: number; name: string } }).data
}

export const addGameToCollection = async (collectionId: number, gameId: number) => {
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

export const removeGameFromCollection = async (collectionId: number, gameId: number) => {
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

export const deleteCollectionById = async (collectionId: number) => {
  const response = await api.delete(`/collection/${collectionId}`)
  return response.data as {
    data: {
      deleted: boolean
      id: number
    }
  }
}
