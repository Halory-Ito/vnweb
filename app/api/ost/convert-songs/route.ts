import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { NETEASE_API_BASE } from '@/app/config'
import { GameOstSongsTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { api } from '@/lib/request-utils'

// 获取网易云歌词
async function fetchLyrics(songId: number): Promise<string> {
  try {
    const lyricResponse = await api.get(`${NETEASE_API_BASE}/lyric`, {
      params: { id: songId },
    })
    const lyricData = lyricResponse.data
    if (lyricData.lrc?.lyric) {
      return lyricData.lrc.lyric
    }
  } catch (err) {
    console.error('Failed to fetch lyric for song:', songId, err)
  }
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as {
      sourceOstId: number
      targetAlbumId: string | number
      direction: 'khinsider-to-netease' | 'netease-to-khinsider'
      songMapping: Array<{
        sourceSongId: number
        targetSongIndex: number
      }>
    }

    const { sourceOstId, targetAlbumId, direction, songMapping } = payload

    // 获取目标专辑的歌曲信息
    let targetSongs: Array<{
      id: number
      name: string
      url: string
      lyricsText?: string
      lyricsPath?: string
    }> = []

    try {
      if (direction === 'khinsider-to-netease') {
        // 获取网易云专辑详情
        const albumId =
          typeof targetAlbumId === 'string'
            ? parseInt(targetAlbumId)
            : targetAlbumId
        const apiUrl = `${NETEASE_API_BASE}/album`
        const response = await api.get(apiUrl, {
          params: { id: albumId },
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: 'https://music.163.com/',
          },
        })

        const data = response.data
        if (data.songs) {
          // 先收集所有歌曲信息
          const songsWithLyricPaths = data.songs.map(
            (song: { id: number; name: string }) => ({
              id: song.id,
              name: song.name,
              url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
              lyricsText: '',
              lyricsPath: `${NETEASE_API_BASE}/lyric?id=${song.id}`,
            }),
          )
          targetSongs = songsWithLyricPaths
        }
      } else {
        // 获取 Khinsider 专辑详情
        const albumUrl =
          typeof targetAlbumId === 'string'
            ? targetAlbumId
            : String(targetAlbumId)
        const response = await api.get('/ost/khinsider/album', {
          params: { url: albumUrl },
        })
        const khinsiderData = response.data
        targetSongs =
          (
            khinsiderData.data?.songs as Array<{ name: string; url: string }>
          )?.map((song, idx) => ({
            id: idx,
            name: song.name,
            url: song.url,
            lyricsText: '',
            lyricsPath: '',
          })) || []
      }

      // 更新源 OST 的歌曲信息
      let convertedCount = 0

      for (const mapping of songMapping) {
        const targetSong = targetSongs[mapping.targetSongIndex]
        if (!targetSong) continue

        const updateData: Record<string, string> = {}

        if (direction === 'khinsider-to-netease') {
          // 用网易云的信息替换 Khinsider 的信息
          if (targetSong.name) {
            updateData.name = targetSong.name
          }
          // 设置歌词路径，转换时将自动获取歌词
          updateData.lyricsPath = targetSong.lyricsPath || ''

          // 如果有歌词文本，直接使用
          if (targetSong.lyricsText) {
            updateData.lyricsText = targetSong.lyricsText
          }
        } else {
          // 用 Khinsider 的 URL 替换网易云的 URL
          if (targetSong.url) {
            updateData.url = targetSong.url
          }
          if (targetSong.name) {
            updateData.name = targetSong.name
          }
        }

        if (Object.keys(updateData).length > 0) {
          await db
            .update(GameOstSongsTable)
            .set({
              ...updateData,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(GameOstSongsTable.id, mapping.sourceSongId))

          convertedCount++
        }
      }

      // 对于 khinsider-to-netease 转换，需要获取歌词
      if (direction === 'khinsider-to-netease' && convertedCount > 0) {
        // 获取刚更新的歌曲
        for (const mapping of songMapping) {
          const targetSong = targetSongs[mapping.targetSongIndex]
          if (!targetSong) continue

          // 从歌词路径中提取歌曲 ID
          const lyricPath = targetSong.lyricsPath || ''
          const match = lyricPath.match(/id=(\d+)/)
          if (match) {
            const songId = parseInt(match[1])
            const lyricsText = await fetchLyrics(songId)
            if (lyricsText) {
              await db
                .update(GameOstSongsTable)
                .set({
                  lyricsText,
                  updatedAt: new Date().toISOString(),
                })
                .where(eq(GameOstSongsTable.id, mapping.sourceSongId))
            }
          }
        }
      }

      return NextResponse.json({
        data: {
          convertedCount,
          sourceOstId,
          targetAlbumId,
          direction,
        },
      })
    } catch (fetchError) {
      console.error('Fetch target album failed:', fetchError)
      return NextResponse.json({ error: '获取目标专辑失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Convert songs failed:', error)
    return NextResponse.json({ error: '转换失败' }, { status: 500 })
  }
}
