import { requestMeting, metingDetails } from './meting'
import { getNeteaseAlbum } from './netease-albums'
import { getNeteaseEnhancedService } from './netease-playback'
import { NETEASE_PLAYBACK_PATH } from '@/features/ost/ost-api'

import type { MetingSong } from './meting'
import type { UnifiedAlbumDetails } from '@/features/ost/types'

export async function getOstAlbum(id: string): Promise<UnifiedAlbumDetails> {
  if (await getNeteaseEnhancedService()) {
    const album = await getNeteaseAlbum(id)
    return {
      source: 'netease',
      name: album.name,
      cover: album.cover,
      songs: album.songs.map((song) => ({
        name: song.name,
        url: NETEASE_PLAYBACK_PATH + '?id=' + song.id,
      })),
    }
  }

  const [album, albumTracks] = await Promise.all([
    getNeteaseAlbum(id),
    requestMeting({ server: 'netease', type: 'album', id }),
  ])
  return buildOstAlbum(id, album, albumTracks)
}

async function buildOstAlbum(
  id: string,
  album: Awaited<ReturnType<typeof getNeteaseAlbum>>,
  albumTracks: MetingSong[],
): Promise<UnifiedAlbumDetails> {
  const tracks = albumTracks.length
    ? albumTracks
    : await readAlbumTracks(album.songs.map((song) => String(song.id)))
  const details = await metingDetails({ server: 'netease', type: 'album', id }, tracks)
  const byId = new Map(tracks.map((track, index) => [track.id, details.songs[index]]))
  const songs = album.songs.map((metadata) => {
    const song = byId.get(String(metadata.id))
    if (!song) throw new Error('Meting 未返回完整专辑曲目')
    const ms = metadata.dt || metadata.duration || 0
    const seconds = Math.floor(ms / 1000)
    return {
      ...song,
      name: metadata.name,
      artist:
        (metadata.ar || metadata.artists)
          ?.map((artist) => artist.name)
          .filter(Boolean)
          .join(' / ') || song.artist,
      alias: (metadata.tns?.length ? metadata.tns : metadata.alias)?.join(' / '),
      duration:
        ms > 0
          ? `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
          : undefined,
    }
  })
  return { ...details, name: album.name, cover: album.cover || details.cover, songs }
}

// 部分 Meting 服务只提供单曲读取：按专辑曲目表分批读取，限制上游并发。
async function readAlbumTracks(ids: string[]): Promise<MetingSong[]> {
  const tracks: MetingSong[] = []
  for (let start = 0; start < ids.length; start += 6) {
    const batch = await Promise.all(
      ids.slice(start, start + 6).map(async (id) => {
        const songs = await requestMeting({ server: 'netease', type: 'song', id })
        const song = songs.find((item) => item.id === id)
        if (!song) throw new Error('Meting 未返回对应专辑曲目')
        return song
      }),
    )
    tracks.push(...batch)
  }
  return tracks
}
