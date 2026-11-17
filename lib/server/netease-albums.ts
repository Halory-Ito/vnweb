import { NETEASE_API_BASE } from '@/app/config'
import { api } from '@/lib/request-utils'
import { isHttpUrl } from '@/lib/server/meting'

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
const usesPublicApi = new URL(NETEASE_API_BASE).hostname === 'music.163.com'

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
  if (usesPublicApi) return requestAt(NETEASE_API_BASE, publicPath, publicParams)
  try {
    return await requestAt(NETEASE_API_BASE, servicePath, serviceParams)
  } catch {
    return requestAt('https://music.163.com/api', publicPath, publicParams)
  }
}

export async function searchNeteaseAlbums(keyword: string): Promise<UnifiedSearchResult[]> {
  const options = { type: 10, offset: 0, total: 'true', limit: 30 }
  const data = await requestAlbums('/search/get/web', { ...options, s: keyword }, '/search', {
    ...options,
    keywords: keyword,
  })
  if (!data.result || (data.result.albums !== undefined && !Array.isArray(data.result.albums)))
    throw new Error('网易云专辑搜索返回异常')
  return (data.result.albums || []).map((album) => {
    if (!Number.isSafeInteger(album.id) || album.id <= 0 || typeof album.name !== 'string')
      throw new Error('网易云专辑信息无效')
    const date = album.publishTime ? new Date(album.publishTime) : null
    return {
      source: 'meting-api',
      id: `netease:album:${album.id}`,
      name: album.name,
      artist: artistName(album),
      cover: isHttpUrl(album.picUrl) ? album.picUrl : '',
      type: 'album',
      year: date && Number.isFinite(date.getTime()) ? String(date.getFullYear()) : undefined,
      songCount: album.size,
      url: `https://music.163.com/#/album?id=${album.id}`,
    }
  })
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
