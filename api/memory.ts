import { api } from '@/lib/request-utils'

import type { GameMemoryItem } from '@/types/media'

export const getGameMemoriesById = async (id: number, title?: string) => {
  const response = await api.get(`/game/${id}/memory`, {
    params: {
      title: title ?? '',
    },
  })
  return (
    response.data as {
      data: {
        items: GameMemoryItem[]
      }
    }
  ).data
}

export const getGameMemoryById = async (gameId: number, memoryId: number) => {
  const response = await api.get(`/game/${gameId}/memory/${memoryId}`)
  return (
    response.data as {
      data: {
        item: GameMemoryItem
      }
    }
  ).data
}

export const createGameMemoryById = async (
  id: number,
  payload: {
    image: File
    title: string
    description: string
  },
) => {
  const formData = new FormData()
  formData.append('image', payload.image)
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  const response = await api.post(`/game/${id}/memory`, formData)
  return (
    response.data as {
      data: {
        item: GameMemoryItem
      }
    }
  ).data
}

export const updateGameMemoryById = async (
  gameId: number,
  memoryId: number,
  payload: {
    title: string
    description: string
    image?: File
  },
) => {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  if (payload.image) {
    formData.append('image', payload.image)
  }
  const response = await api.patch(`/game/${gameId}/memory/${memoryId}`, formData)
  return (
    response.data as {
      data: {
        item: GameMemoryItem
      }
    }
  ).data
}

export const deleteGameMemoryById = async (gameId: number, memoryId: number) => {
  const response = await api.delete(`/game/${gameId}/memory/${memoryId}`)
  return response.data as {
    data: {
      deleted: boolean
      id: number
    }
  }
}
