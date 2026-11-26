import { api } from '@/lib/request-utils'
import { isHttpUrl } from '@/lib/server/meting'
import { readPlatformSettings, resolveEnhancedApiBase } from '@/lib/server/platform-settings'

import type { UnifiedSearchResult } from '@/features/ost/types'

type Artist = { name?: string }
export type AlbumSong = {
  id: number
  name: string
  duration?: number
  dt?: number
  alias?: string[]
  tns?: string[]
  artists?: Artist[]
  ar?: Artist[]
}
type Album = {
  id: number
  name: string
  picUrl?: string
  blurPicUrl?: string
  artist?: Artist
  artists?: Artist[]
  size?: number
  publishTime?: number
  songs?: AlbumSong[]
}
type NeteaseResponse = {
  code: number
  result?: { albums?: Album[]; albumCount?: number }
  album?: Album
  songs?: AlbumSong[]
}
const artistName = (album: Album) =>
  album.artists
    ?.map((artist) => artist.name)
    .filter(Boolean)
    .join(' / ') || album.artist?.name

async function requestAt(base: string, path: string, params?: Record<string, string | number>) {
  const { data } = await api.request<NeteaseResponse>({
    method: 'GET',
    url: `${base.replace(/\/$/, '')}${path}`,
    params,
    headers: {
      Referer: 'https://music.163.com/',
      Accept: 'application/json',
    },
    timeout: 20000,
  })
  if (!data || data.code !== 200) throw new Error('网易云专辑接口返回异常')
  return data
}

async function requestAlbums(
  publicPath: string,
  publicParams: Record<string, string | number> | undefined,
  servicePath: string,
  serviceParams: Record<string, string | number>,
) {
  const { enhanced } = await readPlatformSettings()
  const apiBase = resolveEnhancedApiBase(enhanced)
  const usesPublicApi = new URL(apiBase).hostname === 'music.163.com'

  if (usesPublicApi) return requestAt(apiBase, publicPath, publicParams)
  try {
    return await requestAt(apiBase, servicePath, serviceParams)
  } catch {
    return requestAt('https://music.163.com/api', publicPath, publicParams)
  }
}

export type NeteaseAlbumSearchResult = {
  items: UnifiedSearchResult[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export async function searchNeteaseAlbums(
  keyword: string,
  options?: { page?: number; pageSize?: number },
): Promise<NeteaseAlbumSearchResult> {
  const rawPage = options?.page ?? 1
  const rawPageSize = options?.pageSize ?? 30
  const page = Number.isInteger(rawPage) ? Math.min(Math.max(rawPage, 1), 1000) : 1
  const pageSize = Number.isInteger(rawPageSize) ? Math.min(Math.max(rawPageSize, 1), 100) : 30
  const offset = (page - 1) * pageSize

  const data = await requestAt('https://music.163.com/api', '/cloudsearch/pc', {
    type: 10,
    offset,
    total: 'true',
    limit: pageSize,
    s: keyword,
  })
  if (!data.result || (data.result.albums !== undefined && !Array.isArray(data.result.albums)))
    throw new Error('网易云专辑搜索返回异常')

  const rawAlbums = data.result.albums || []
  // 网易云 cloudsearch/pc 在 offset >= 300 时会忽略分页参数返回完整列表，服务端需自行切片并修正总数
  const isFullSlice = rawAlbums.length > pageSize
  const pageAlbums = isFullSlice ? rawAlbums.slice(offset, offset + pageSize) : rawAlbums

  const items = pageAlbums.map((album) => {
    if (!Number.isSafeInteger(album.id) || album.id <= 0 || typeof album.name !== 'string')
      throw new Error('网易云专辑信息无效')
    const date = album.publishTime ? new Date(album.publishTime) : null
    return {
      source: 'meting-api' as const,
      id: `netease:album:${album.id}`,
      name: album.name,
      artist: artistName(album),
      cover: isHttpUrl(album.picUrl) ? album.picUrl : '',
      type: 'album' as const,
      year: date && Number.isFinite(date.getTime()) ? String(date.getFullYear()) : undefined,
      songCount: album.size,
      url: `https://music.163.com/#/album?id=${album.id}`,
    }
  })

  const rawTotal = data.result.albumCount
  const total = isFullSlice
    ? rawAlbums.length
    : typeof rawTotal === 'number' && Number.isSafeInteger(rawTotal) && rawTotal > 0
      ? Math.max(rawTotal, offset + items.length)
      : items.length > 0
        ? offset + items.length
        : 0

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: items.length > 0 && offset + items.length < total,
  }
}

export async function getNeteaseAlbum(id: string) {
  const data = await requestAlbums(`/v1/album/${id}`, undefined, '/album', { id })
  const album = data.album
  const songs = data.songs || album?.songs
  if (
    !album ||
    String(album.id) !== id ||
    typeof album.name !== 'string' ||
    !Array.isArray(songs) ||
    !songs.length ||
    !songs.every((song) => Number.isSafeInteger(song.id) && typeof song.name === 'string')
  )
    throw new Error('网易云专辑不存在或曲目为空')
  return {
    name: album.name,
    cover: isHttpUrl(album.picUrl) ? album.picUrl : '',
    songs,
  }
}
