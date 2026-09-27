import { api } from '@/lib/request-utils'

import type { PvManageItem } from '@/types/pv'

export const getPvManageList = async (params?: { keyword?: string; gameId?: number }) => {
  const response = await api.get('/pv', {
    params: {
      keyword: params?.keyword ?? '',
      gameId: params?.gameId ?? undefined,
    },
  })
  return (response.data as { data: { items: PvManageItem[] } }).data
}

export const createPvManageItem = async (payload: {
  gameId: number
  name: string
  url: string
}) => {
  const response = await api.post('/pv', payload)
  return response.data as {
    data: {
      item: {
        id: number
        gameId: number
        name: string
        url: string
        createdAt: string | null
        updatedAt: string | null
      }
    }
  }
}

export const updatePvManageItem = async (
  id: number,
  payload: {
    gameId: number
    name: string
    url: string
  },
) => {
  const response = await api.patch(`/pv/${id}`, payload)
  return response.data as {
    data: {
      updated: boolean
      id: number
    }
  }
}

export const deletePvManageItem = async (id: number) => {
  const response = await api.delete(`/pv/${id}`)
  return response.data as {
    data: {
      deleted: boolean
      id: number
    }
  }
}
