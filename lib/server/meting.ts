import Meting from '@meting/core'

import { readPlatformSettings } from './platform-settings'
import { METING_ID_PATTERN, metingMediaPath } from '@/features/ost/meting-types'

import type { MetingInput, MetingMediaType, MetingServer } from '@/features/ost/meting-types'
import type { UnifiedAlbumDetails } from '@/features/ost/types'

export type MetingSong = {
  id: string
  name: string
  artist: string
  album: string
  urlId: string
  lyricId?: string
  pictureId?: string
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

function readId(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return
  const id = String(value)
  return METING_ID_PATTERN.test(id) ? id : undefined
}

async function createMetingClient(server: MetingServer) {
  const { meting } = await readPlatformSettings()
  const sdk = new Meting(server).format(true)
  if (server === 'netease' && meting.neteaseCookie) sdk.cookie(meting.neteaseCookie)
  return { sdk, settings: meting }
}

export async function requestMeting(input: MetingInput): Promise<MetingSong[]> {
  const { sdk } = await createMetingClient(input.server)
  const json =
    input.type === 'search'
      ? await sdk.search(input.id, { type: 1, limit: 30 })
      : await sdk[input.type](input.id)

  const results: unknown = JSON.parse(json)
  if (!Array.isArray(results)) throw new Error('Invalid Meting SDK response')

  return results.flatMap((song): MetingSong[] => {
    if (!song || typeof song !== 'object' || typeof song.name !== 'string') return []
    const id = readId(song.id)
    const urlId = readId(song.url_id)
    if (!id || !urlId) return []
    return [
      {
        id,
        name: song.name,
        artist: Array.isArray(song.artist)
          ? song.artist.filter((item: unknown) => typeof item === 'string').join(' / ')
          : typeof song.artist === 'string'
            ? song.artist
            : '',
        album: typeof song.album === 'string' ? song.album : '',
        urlId,
        lyricId: readId(song.lyric_id),
        pictureId: readId(song.pic_id),
      },
    ]
  })
}

export async function readMetingMedia(server: MetingServer, type: MetingMediaType, id: string) {
  const { sdk, settings } = await createMetingClient(server)
  if (type === 'lyric') {
    const data = JSON.parse(await sdk.lyric(id))
    return [data?.lyric, data?.tlyric]
      .filter((value) => typeof value === 'string' && value.trim())
      .join('\n')
  }

  const json =
    type === 'pic' ? await sdk.pic(id, settings.coverSize) : await sdk.url(id, settings.bitrate)
  const data = JSON.parse(json)
  return isHttpUrl(data?.url) ? data.url : ''
}

export async function metingDetails(
  input: MetingInput,
  songs: MetingSong[],
): Promise<UnifiedAlbumDetails> {
  const pictureId = songs.find((song) => song.pictureId)?.pictureId
  const cover = pictureId
    ? await readMetingMedia(input.server, 'pic', pictureId).catch(() => '')
    : ''
  const albumName = input.type === 'album' ? songs[0]?.album : ''
  return {
    source: 'meting-api',
    name:
      (input.type === 'song' ? songs[0]?.name : albumName) ||
      `Meting ${input.type === 'album' ? '专辑' : '歌单'} ${input.id}`,
    cover,
    songs: songs.map((song) => ({
      name: song.name,
      artist: song.artist,
      url: metingMediaPath(input.server, 'url', song.urlId),
      lyricsPath: song.lyricId ? metingMediaPath(input.server, 'lyric', song.lyricId) : '',
    })),
  }
}
