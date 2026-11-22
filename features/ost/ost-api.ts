import { getMetingMediaRef, metingMediaPath } from './meting-types'
import { api } from '@/lib/request-utils'

import type { MetingInput, MetingServer } from './meting-types'
import type { UnifiedAlbumDetails, UnifiedSearchResult } from './types'

export const NETEASE_PLAYBACK_PATH = '/api/ost/netease/playback'

export async function resolveNeteasePlaybackApi(id: string, keepStoredUrl: boolean) {
  const response = await api.request<{ data: { url: string } }>({
    method: 'GET',
    url: '/ost/netease/playback',
    params: { id, keepStoredUrl },
  })
  return response.status === 204 ? undefined : response.data.data.url
}

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

export async function fetchLyricTextApi(url: string, signal?: AbortSignal): Promise<string> {
  const legacy = getMetingMediaRef(url, 'lyric') || getMetingMediaRef(url, 'lrc')
  const path = legacy ? metingMediaPath(legacy.server, 'lyric', legacy.id) : url
  const response = await api.request<string>({
    method: 'GET',
    url: path.startsWith('/api/ost/meting?') ? path.slice('/api'.length) : path,
    responseType: 'text',
    signal,
  })
  return typeof response.data === 'string' ? response.data : ''
}
