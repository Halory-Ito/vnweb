import { METING_API_BASE, METING_API_AUTH } from '@/app/config'
import { api } from '@/lib/request-utils'

import type { MetingInput } from '@/features/ost/meting-types'
import type { UnifiedAlbumDetails } from '@/features/ost/types'

export type MetingSong = {
  name?: string
  title?: string
  artist?: string | string[]
  author?: string
  url: string
  pic?: string
  lrc?: string
}
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}
export class MetingUnsupportedTypeError extends Error {}

export async function requestMeting(input: MetingInput): Promise<MetingSong[]> {
  const response = await api.request<unknown>({
    method: 'GET',
    url: METING_API_BASE,
    params: { ...input, ...(METING_API_AUTH ? { auth: METING_API_AUTH } : {}) },
    timeout: 20000,
  })
  if (
    response.data &&
    typeof response.data === 'object' &&
    'error' in response.data &&
    response.data.error === 'unknown type'
  )
    throw new MetingUnsupportedTypeError('当前 Meting 服务不支持此读取类型')
  if (
    !Array.isArray(response.data) ||
    !response.data.every(
      (song): song is MetingSong =>
        song &&
        typeof song === 'object' &&
        typeof (song.title || song.name) === 'string' &&
        isHttpUrl(song.url),
    )
  )
    throw new Error('Invalid Meting response')
  return response.data
}
export function metingDetails(input: MetingInput, songs: MetingSong[]): UnifiedAlbumDetails {
  return {
    source: 'meting-api',
    name:
      input.type === 'song'
        ? songs[0]?.title || songs[0]?.name || ''
        : `Meting ${input.type === 'album' ? '专辑' : '歌单'} ${input.id}`,
    cover: songs.find((song) => isHttpUrl(song.pic))?.pic || '',
    songs: songs.map((song) => ({
      name: (song.title || song.name)!,
      artist: Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist || song.author,
      url: song.url,
      lyricsPath: isHttpUrl(song.lrc) ? song.lrc : '',
    })),
  }
}
