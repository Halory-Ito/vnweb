import { NextRequest, NextResponse } from 'next/server'

import { NETEASE_API_BASE } from '@/app/config'
/**
 * 获取网易云音乐专辑详情和歌曲列表
 * 使用第三方镜像 API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 },
      )
    }

    // 使用镜像 API 获取专辑详情
    const apiUrl = `${NETEASE_API_BASE}/album?id=${id}`

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://music.163.com/',
        Accept: 'application/json',
      },
    })

    const data = await res.json()

    if (data.code !== 200 && data.code !== 220) {
      return NextResponse.json(
        { error: data.message || '获取专辑详情失败', details: data },
        { status: 500 },
      )
    }

    const album = data.album

    if (!album) {
      return NextResponse.json({ error: '专辑不存在' }, { status: 404 })
    }

    // 提取歌曲列表
    const songs = (data.songs || []).map(
      (
        song: {
          id: number
          name: string
          alias?: string[]
          tns?: string[]
          ar?: Array<{ id: number; name: string }>
          artists?: Array<{ id: number; name: string }>
          al?: { name: string; id: number }
          album?: { name: string; id: number }
          dt?: number
          duration?: number
          fee?: number
        },
        index: number,
      ) => {
        // 获取艺术家名称，优先使用 ar 字段
        const artistName =
          song.ar?.map((a) => a.name).join(', ') ||
          song.artists?.map((a) => a.name).join(', ') ||
          '未知艺术家'

        // 获取时长，优先使用 dt 字段
        const durationMs = song.dt || song.duration || 0

        // 获取别名，优先使用 tns（翻译名称）
        const aliasValue =
          (Array.isArray(song.tns) && song.tns.length > 0
            ? song.tns.join(' / ')
            : null) ||
          (Array.isArray(song.alias) && song.alias.length > 0
            ? song.alias.filter(Boolean).join(' / ')
            : null)

        return {
          index: index + 1,
          id: song.id,
          name: song.name,
          alias: aliasValue,
          artist: artistName,
          album: song.al?.name || song.album?.name || album.name,
          albumId: song.al?.id || song.album?.id || album.id,
          duration: formatDuration(durationMs),
          durationMs,
          url: `https://music.163.com/#/song?id=${song.id}`,
          isFree: song.fee === 0 || song.fee === 8,
        }
      },
    )

    return NextResponse.json({
      data: {
        id: album.id,
        name: album.name,
        artist: album.artist?.name || album.artists?.[0]?.name || '未知艺术家',
        artistId: album.artist?.id || album.artists?.[0]?.id || null,
        cover: album.picUrl || album.blurPicUrl || '',
        publishTime: album.publishTime
          ? new Date(album.publishTime).toISOString().split('T')[0]
          : null,
        description: album.description || '',
        songs,
        songCount: songs.length,
        url: `https://music.163.com/#/album?id=${album.id}`,
      },
    })
  } catch (error) {
    console.error('Get album details failed:', error)
    return NextResponse.json(
      { error: 'Failed to get album details' },
      { status: 500 },
    )
  }
}

/**
 * 格式化时长 (ms -> mm:ss)
 */
function formatDuration(ms: number): string {
  if (!ms) return '00:00'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}
