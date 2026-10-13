import { api } from '@/lib/request-utils'

import type { QuoteManageItem } from '@/types/quote'

export const getQuoteManageList = async (params?: {
  keyword?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}) => {
  const response = await api.get('/quote', {
    params: {
      keyword: params?.keyword ?? '',
      dateFrom: params?.dateFrom ?? '',
      dateTo: params?.dateTo ?? '',
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
  })
  return (
    response.data as {
      data: {
        items: QuoteManageItem[]
        pagination: {
          page: number
          pageSize: number
          total: number
          totalPages: number
        }
      }
    }
  ).data
}

export const createQuoteManageItem = async (payload: {
  gameId: number
  content: string
  characterId: string
  context: string
}) => {
  const response = await api.post('/quote', payload)
  return response.data as {
    data: {
      item: {
        id: number
        gameId: number
        content: string
        characterId: string
        context: string
        createdAt: string | null
        updatedAt: string | null
      }
    }
  }
}

export const updateQuoteManageItem = async (
  id: number,
  payload: {
    gameId: number
    content: string
    characterId: string
    context: string
  },
) => {
  const response = await api.patch(`/quote/${id}`, payload)
  return response.data as {
    data: {
      updated: boolean
      id: number
    }
  }
}

export const deleteQuoteManageItem = async (id: number) => {
  const response = await api.delete(`/quote/${id}`)
  return response.data as {
    data: {
      deleted: boolean
      id: number
    }
  }
}

const resolveDownloadFileName = (headers: Record<string, unknown>, fallback: string) => {
  const contentDisposition =
    (headers['content-disposition'] as string | undefined) ??
    (headers['Content-Disposition'] as string | undefined)

  if (!contentDisposition) {
    return fallback
  }

  const match = contentDisposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)
  return match?.[1] ? decodeURIComponent(match[1].replace(/"/g, '')) : fallback
}

export const exportQuoteXlsxApi = async (params?: {
  keyword?: string
  dateFrom?: string
  dateTo?: string
  gameIds?: number[]
}) => {
  const response = await api.get('/quote/export-xlsx', {
    params: {
      keyword: params?.keyword ?? '',
      dateFrom: params?.dateFrom ?? '',
      dateTo: params?.dateTo ?? '',
      gameIds: params?.gameIds?.length ? params.gameIds.join(',') : '',
    },
    responseType: 'blob',
  })

  const count = Number(response.headers['x-export-count']) || 0
  const fileName = resolveDownloadFileName(
    response.headers as Record<string, unknown>,
    'vnweb-quotes.xlsx',
  )

  return { blob: response.data as Blob, fileName, count }
}

export const getGameQuotesByGameId = async (gameId: number) => {
  const response = await api.get('/quote', {
    params: {
      gameId,
    },
  })
  return (response.data as { data: { items: QuoteManageItem[] } }).data
}

export const getQuotesByCharacterId = async (characterId: string) => {
  const response = await api.get('/quote', {
    params: {
      characterId,
    },
  })
  return (response.data as { data: { items: QuoteManageItem[] } }).data
}
