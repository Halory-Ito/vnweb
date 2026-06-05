import dayjs from 'dayjs'

import { api } from '@/lib/request-utils'
import type {
  MusicSource,
  NeteaseQuality,
  UnifiedAlbumDetails,
  UnifiedSearchResult,
} from './types'

/**
 * 格式化日期显示
 */
export function toDisplayDate(date: string | null | undefined): string {
  if (!date) return '-'
  const d = dayjs(date)
  return d.isValid() ? d.format('YYYY-MM-DD') : '-'
}

// ==================== Khinsider ====================

/**
 * 搜索 khinsider 专辑 (通过 API 代理)
 */
export async function searchKhinsiderAlbums(kw: string) {
  const response = await api.get('/ost/khinsider', {
    params: { kw },
  })

  const data = response.data.data as Array<{
    name: string
    url: string
    type: 'album' | 'soundtrack'
    cover: string
    year?: string
  }>

  // 转换为统一格式
  return data.map((item) => ({
    source: 'khinsider' as const,
    id: item.url,
    name: item.name,
    type: item.type,
    year: item.year,
    cover: item.cover,
    url: item.url,
  }))
}

/**
 * 获取 khinsider 专辑详情 (通过 API 代理)
 */
export async function getKhinsiderAlbumDetails(albumUrl: string) {
  const response = await api.get('/ost/khinsider/album', {
    params: { url: albumUrl },
  })

  const data = response.data.data as {
    name: string
    covers: string[]
    songs: Array<{ name: string; url: string; duration?: string }>
  }

  // 转换为统一格式
  return {
    source: 'khinsider' as const,
    name: data.name,
    cover: data.covers[0] || '',
    songs: data.songs.map((song) => ({
      name: song.name,
      url: song.url,
      duration: song.duration,
    })),
  } satisfies UnifiedAlbumDetails
}

// ==================== Netease ====================

/**
 * 搜索网易云音乐专辑 (通过 API 代理)
 */
export async function searchNeteaseAlbums(kw: string) {
  const response = await api.get('/ost/netease', {
    params: { kw },
  })

  const data = response.data.data as Array<{
    id: number
    name: string
    artist: string
    cover: string
    publishTime: string | null
    songCount: number
    url: string
  }>

  // 转换为统一格式
  return data.map((item) => ({
    source: 'netease' as const,
    id: item.id,
    name: item.name,
    artist: item.artist,
    songCount: item.songCount,
    cover: item.cover,
    url: item.url,
  }))
}

/**
 * 获取网易云音乐专辑详情 (通过 API 代理)
 */
export async function getNeteaseAlbumDetails(albumId: number) {
  const response = await api.get(`/ost/netease/${albumId}`)

  const data = response.data.data as {
    id: number
    name: string
    artist: string
    artistId: number | null
    cover: string
    publishTime: string | null
    description: string
    songs: Array<{
      index: number
      id: number
      name: string
      alias: string | null
      artist: string
      album: string
      albumId: number
      duration: string
      durationMs: number
      url: string
      isFree: boolean
    }>
    songCount: number
    url: string
  }

  // 转换为统一格式
  // 注意：网易云歌曲的 url 保存为 API 路径，提交时会替换为真实 URL
  return {
    source: 'netease' as const,
    name: data.name,
    cover: data.cover,
    songs: data.songs.map((song) => ({
      name: song.name,
      // 保存为 API 路径格式，提交时会替换为真实 URL
      url: `/song/url/v1?id=${song.id}&level=exhigh`,
      alias: song.alias,
      artist: song.artist,
      duration: song.duration,
      isFree: song.isFree,
      neteaseId: song.id,
    })),
  } satisfies UnifiedAlbumDetails
}

// ==================== Unified API ====================

/**
 * 统一搜索专辑
 */
export async function searchAlbums(
  kw: string,
  source: MusicSource,
): Promise<UnifiedSearchResult[]> {
  if (source === 'netease') {
    return searchNeteaseAlbums(kw)
  }
  return searchKhinsiderAlbums(kw)
}

/**
 * 统一获取专辑详情
 */
export async function getAlbumDetails(
  source: MusicSource,
  albumIdOrUrl: string | number,
): Promise<UnifiedAlbumDetails> {
  if (source === 'netease') {
    return getNeteaseAlbumDetails(albumIdOrUrl as number)
  }
  return getKhinsiderAlbumDetails(albumIdOrUrl as string)
}

/**
 * 获取网易云音乐歌曲真实 URL
 */
export async function getNeteaseSongUrls(
  songIds: number[],
  quality: NeteaseQuality = 'exhigh',
): Promise<Array<{ id: number; url: string; size: number; level: string }>> {
  const idParam = songIds.join(',')
  const response = await api.get('/ost/netease/song/url', {
    params: { id: idParam, level: quality },
  })

  return response.data.data as Array<{
    id: number
    url: string
    size: number
    level: string
  }>
}
