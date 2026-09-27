import { api } from '@/lib/request-utils'

import type { OstManageItem, OstSongItem } from '@/types/ost'

export const getOstManageList = async (params?: { keyword?: string; gameId?: number }) => {
  const response = await api.get('/ost', {
    params: {
      keyword: params?.keyword ?? '',
      gameId: params?.gameId ?? undefined,
    },
  })
  return (response.data as { data: { items: OstManageItem[] } }).data
}

export const getOstById = async (id: number) => {
  const response = await api.get(`/ost/${id}`)
  return (response.data as { data: { item: OstManageItem } }).data
}

export const getOstSongs = async (ostId: number) => {
  const response = await api.get('/ost/songs', { params: { ostId } })
  return (response.data as { data: { items: OstSongItem[] } }).data
}

export const createOstSong = async (payload: {
  gameId: number
  ostId: number
  name: string
  url: string
  mediaType?: string
  lyricsText?: string
  lyricsPath?: string
}) => {
  const response = await api.post('/ost/songs', payload)
  return (response.data as { data: { item: OstSongItem } }).data
}

export const updateOstSong = async (
  id: number,
  payload: {
    name: string
    url: string
    mediaType?: string
    lyricsText?: string
    lyricsPath?: string
  },
) => {
  const response = await api.put(`/ost/songs/${id}`, payload)
  return (response.data as { data: { item: OstSongItem } }).data
}

export const deleteOstSong = async (id: number) => {
  const response = await api.delete(`/ost/songs/${id}`)
  return response.data
}

export const createOstManageItem = async (payload: {
  gameId: number
  name: string
  cover: string
  resource?: string
  songs?: Array<{
    name: string
    url: string
    mediaType?: string
  }>
}) => {
  const response = await api.post('/ost', payload)
  return response.data as {
    data: {
      item: {
        id: number
        gameId: number
        name: string
        cover: string
        resource: string
        createdAt: string | null
        updatedAt: string | null
      }
    }
  }
}

export const updateOstManageItem = async (
  id: number,
  payload: {
    gameId: number
    name: string
    cover: string
    resource?: string
  },
) => {
  const response = await api.patch(`/ost/${id}`, payload)
  return response.data as {
    data: {
      updated: boolean
      id: number
    }
  }
}

export const deleteOstManageItem = async (id: number) => {
  const response = await api.delete(`/ost/${id}`)
  return response.data as {
    data: {
      deleted: boolean
      id: number
    }
  }
}
