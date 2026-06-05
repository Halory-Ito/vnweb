import { NETEASE_API_BASE } from '@/app/config'
import { api } from '@/lib/request-utils'

// 获取网易云专辑歌曲信息
export type NeteaseSongItem = {
  id: number
  name: string
  url: string
  lyricsText: string
  lyricsPath: string
}

// 获取网易云专辑歌曲列表
export async function getNeteaseAlbumSongs(
  albumId: string,
): Promise<NeteaseSongItem[]> {
  const response = await api.get(`/ost/netease/${albumId}`)
  const albumData = response.data

  return (
    albumData.data?.songs?.map((song: { id: number; name: string }) => ({
      id: song.id,
      name: song.name,
      url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
      lyricsText: '',
      lyricsPath: `${NETEASE_API_BASE}/lyric?id=${song.id}`,
    })) || []
  )
}
