import { getMetingMediaRef, metingMediaPath } from './meting-types'
import { api } from '@/lib/request-utils'

import type { MetingInput, MetingServer } from './meting-types'
import type { UnifiedAlbumDetails, UnifiedSearchResult } from './types'

export const NETEASE_PLAYBACK_PATH = '/api/ost/netease/playback'
export const NETEASE_LYRIC_PATH = '/api/ost/netease/lyric'

export function isInternalLyricApiPath(path: string): boolean {
  return path.startsWith('/api/ost/meting?') || path.startsWith(`${NETEASE_LYRIC_PATH}?`)
}

export function resolveSongLyricsPath(
  song: { url?: string; lyricsPath?: string } | null | undefined,
): string {
  const explicitPath = song?.lyricsPath?.trim()
  if (explicitPath) {
    return explicitPath
  }

  const url = song?.url?.trim() ?? ''
  if (url.startsWith(`${NETEASE_PLAYBACK_PATH}?`)) {
    const id = url.match(/[?&]id=(\d{1,30})(?:&|$)/)?.[1]
    if (id) {
      return `${NETEASE_LYRIC_PATH}?id=${id}`
    }
  }

  return ''
}

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

export type OstAlbumSearchPage = {
  items: UnifiedSearchResult[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export async function searchOstAlbumsPage(
  keyword: string,
  params?: { page?: number; pageSize?: number },
  signal?: AbortSignal,
): Promise<OstAlbumSearchPage> {
  const response = await api.request<{ data: OstAlbumSearchPage }>({
    method: 'GET',
    url: '/ost/albums',
    params: {
      keyword,
      ...(params?.page !== undefined ? { page: params.page } : {}),
      ...(params?.pageSize !== undefined ? { pageSize: params.pageSize } : {}),
    },
    signal,
  })
  return response.data.data
}

export async function searchOstAlbums(keyword: string): Promise<UnifiedSearchResult[]> {
  const result = await searchOstAlbumsPage(keyword)
  return result.items
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
    url: isInternalLyricApiPath(path) ? path.slice('/api'.length) : path,
    responseType: 'text',
    signal,
  })
  return typeof response.data === 'string' ? response.data : ''
}
