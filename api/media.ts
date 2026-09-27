import { api } from '@/lib/request-utils'

import type { GameMediaLinkItem } from '@/types/media'

export const getGamePvsById = async (id: number) => {
  const response = await api.get(`/game/${id}/pv`)
  return (
    response.data as {
      data: {
        items: GameMediaLinkItem[]
      }
    }
  ).data
}

export const syncSteamPvsByGameId = async (
  id: number,
  payload?: {
    steamAppId?: string | number
  },
) => {
  const response = await api.post(`/game/${id}/pv/steam-sync`, payload)
  return (
    response.data as {
      data: {
        gameId: number
        steamAppId: number
        total: number
        inserted: number
        skipped: number
      }
    }
  ).data
}

export const createGamePvById = async (
  id: number,
  payload: {
    name: string
    url: string
  },
) => {
  const response = await api.post(`/game/${id}/pv`, payload)
  return (
    response.data as {
      data: {
        item: GameMediaLinkItem
      }
    }
  ).data
}

export const updateGamePvById = async (
  id: number,
  payload: {
    itemId: number
    name: string
    url: string
  },
) => {
  const response = await api.patch(`/game/${id}/pv`, payload)
  return (
    response.data as {
      data: {
        item: GameMediaLinkItem
      }
    }
  ).data
}

export const deleteGamePvById = async (id: number, itemId: number) => {
  const response = await api.delete(`/game/${id}/pv`, {
    params: {
      itemId,
    },
  })
  return (
    response.data as {
      data: {
        deleted: boolean
        itemId: number
      }
    }
  ).data
}

export const importLocalGamePvById = async (id: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post(`/game/${id}/pv/import`, formData)
  return (
    response.data as {
      data: {
        name: string
        path: string
      }
    }
  ).data
}

export const getGameOstsById = async (id: number) => {
  const response = await api.get(`/game/${id}/ost`)
  return (
    response.data as {
      data: {
        items: GameMediaLinkItem[]
      }
    }
  ).data
}

export const createGameOstById = async (
  id: number,
  payload: {
    name: string
    url: string
  },
) => {
  const response = await api.post(`/game/${id}/ost`, payload)
  return (
    response.data as {
      data: {
        item: GameMediaLinkItem
      }
    }
  ).data
}

export const updateGameOstById = async (
  id: number,
  payload: {
    itemId: number
    name: string
    url: string
  },
) => {
  const response = await api.patch(`/game/${id}/ost`, payload)
  return (
    response.data as {
      data: {
        item: GameMediaLinkItem
      }
    }
  ).data
}

export const deleteGameOstById = async (id: number, itemId: number) => {
  const response = await api.delete(`/game/${id}/ost`, {
    params: {
      itemId,
    },
  })
  return (
    response.data as {
      data: {
        deleted: boolean
        itemId: number
      }
    }
  ).data
}

export const importLocalGameOstById = async (id: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post(`/game/${id}/ost/import`, formData)
  return (
    response.data as {
      data: {
        name: string
        path: string
      }
    }
  ).data
}

export const uploadGameOstLyricById = async (
  id: number,
  payload: {
    itemId: number
    file: File
  },
) => {
  const formData = new FormData()
  formData.append('itemId', String(payload.itemId))
  formData.append('file', payload.file)
  const response = await api.post(`/game/${id}/ost/lyric`, formData)
  return (
    response.data as {
      data: {
        itemId: number
        path: string
      }
    }
  ).data
}
