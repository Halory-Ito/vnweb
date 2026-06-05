import { NextRequest, NextResponse } from 'next/server'

import { api } from '@/lib/request-utils'

const KHINSIDER_BASE = 'https://downloads.khinsider.com'

// 从歌曲详情页面获取实际下载链接
// 返回格式: { url: '实际下载URL', index: 歌曲索引 }
const getSongDownloadInfo = async (
  songPageUrl: string,
  index: number,
): Promise<{ index: number; url: string } | null> => {
  try {
    const res = await api.get(songPageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: songPageUrl,
        Origin: KHINSIDER_BASE,
      },
      responseType: 'text',
    })

    const html = res.data

    // 从 audio 标签提取下载链接
    const audioSrcPattern =
      /<audio[^>]+src="([^"]+\.(?:mp3|flac|ogg|wav|m4a|aac|opus))"[^>]*>/i
    const audioMatch = html.match(audioSrcPattern)

    let downloadUrl: string | null = null

    if (audioMatch) {
      downloadUrl = audioMatch[1]
    } else {
      // 备用：尝试从 source 标签提取
      const sourcePattern =
        /<source[^>]+src="([^"]+\.(?:mp3|flac|ogg|wav|m4a|aac|opus))"[^>]*>/i
      const sourceMatch = html.match(sourcePattern)
      if (sourceMatch) {
        downloadUrl = sourceMatch[1]
      }
    }

    if (!downloadUrl) {
      return null
    }

    return { index, url: downloadUrl }
  } catch {
    return null
  }
}

/**
 * 获取专辑详情
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const albumUrl = searchParams.get('url')

    if (!albumUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 },
      )
    }

    const res = await api.get(albumUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: albumUrl,
        Origin: KHINSIDER_BASE,
      },
      responseType: 'text',
    })

    const html = res.data

    const result: {
      name: string
      covers: string[]
      songs: Array<{ name: string; url: string; duration?: string }>
    } = {
      name: '',
      covers: [],
      songs: [],
    }

    // 提取专辑名称
    const h2Match = html.match(/<h2[^>]*>([^<]+)<\/h2>/i)
    if (h2Match) {
      result.name = h2Match[1].trim()
    }

    // 提取封面图片 - 使用高质量版本
    const coverPattern =
      /<img src="(https:\/\/[a-z]+\.vgmtreasurechest\.com\/soundtracks\/[^"]+\/thumbs\/[^"]+\.(?:jpg|png|jpeg|gif))"/gi

    let coverMatch
    while ((coverMatch = coverPattern.exec(html)) !== null) {
      const coverUrl = coverMatch[1]
      // 去掉 thumbs/ 前缀获取高质量版本
      const highQualityUrl = coverUrl.replace('/thumbs/', '/')
      if (!result.covers.includes(highQualityUrl)) {
        result.covers.push(highQualityUrl)
      }
    }

    // 提取歌曲列表 - 收集 khinsider URL、歌曲名和索引
    const songPattern =
      /<td class="clickable-row"><a href="(\/game-soundtracks\/album\/[^/]+\/[^"]+\.mp3)"[^>]*>([^<]+)<\/a><\/td>/gi

    const songList: Array<{
      name: string
      khinsiderUrl: string
      index: number
    }> = []

    let match
    let songIndex = 0
    while ((match = songPattern.exec(html)) !== null) {
      const khinsiderPath = match[1]
      const songName = decodeURIComponent(match[2].trim())

      if (songName.length < 1) continue

      const fullUrl = new URL(khinsiderPath, KHINSIDER_BASE).href
      songList.push({ name: songName, khinsiderUrl: fullUrl, index: songIndex })
      songIndex++
    }

    // 提取时长信息
    const durationPattern =
      /<td class="clickable-row" align="right">(\d+:\d+)<\/td>/gi
    const durationMap = new Map<number, string>()
    let durationIndex = 0
    let durationMatch
    while ((durationMatch = durationPattern.exec(html)) !== null) {
      durationMap.set(durationIndex, durationMatch[1])
      durationIndex++
    }

    // 多线程获取所有歌曲的实际下载链接
    const downloadPromises = songList.map((song, idx) =>
      getSongDownloadInfo(song.khinsiderUrl, idx),
    )
    const downloadResults = await Promise.all(downloadPromises)

    // 按索引排序并构建最终歌曲列表
    const songUrlMap = new Map<number, string>()
    for (const result of downloadResults) {
      if (result) {
        songUrlMap.set(result.index, result.url)
      }
    }

    for (let i = 0; i < songList.length; i++) {
      const song = songList[i]
      result.songs.push({
        name: song.name,
        url: songUrlMap.get(i) || song.khinsiderUrl,
        duration: durationMap.get(i),
      })
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Get album details failed:', error)
    return NextResponse.json(
      { error: 'Failed to get album details' },
      { status: 500 },
    )
  }
}
