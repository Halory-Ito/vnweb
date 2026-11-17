import { api } from '@/lib/request-utils'

import type { MetingInput, MetingServer } from './meting-types'
import type { UnifiedAlbumDetails, UnifiedSearchResult } from './types'

export async function getMetingDetails(params: MetingInput): Promise<UnifiedAlbumDetails> {
  const response = await api.request<{ data: UnifiedAlbumDetails }>({
    method: 'GET',
    url: '/ost/meting',
    params,
  })
  return response.data.data
}
export async function searchMeting(
  keyword: string,
  server: MetingServer = 'netease',
): Promise<UnifiedSearchResult[]> {
  const response = await api.request<{ data: UnifiedSearchResult[] }>({
    method: 'GET',
    url: '/ost/meting',
    params: { server, type: 'search', id: keyword },
  })
  return response.data.data
}

export async function searchOstAlbums(keyword: string): Promise<UnifiedSearchResult[]> {
  const response = await api.request<{ data: UnifiedSearchResult[] }>({
    method: 'GET',
    url: '/ost/albums',
    params: { keyword },
  })
  return response.data.data
}

export async function getOstAlbumDetails(id: string): Promise<UnifiedAlbumDetails> {
  const response = await api.request<{ data: UnifiedAlbumDetails }>({
    method: 'GET',
    url: `/ost/albums/${id}`,
  })
  return response.data.data
}
