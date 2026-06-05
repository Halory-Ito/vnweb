import { NextRequest, NextResponse } from 'next/server'

import { NETEASE_API_BASE } from '@/app/config'
import { api } from '@/lib/request-utils'
/**
 * 搜索网易云音乐专辑
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const kw = searchParams.get('kw')

    if (!kw) {
      return NextResponse.json(
        { error: 'Missing kw parameter' },
        { status: 400 },
      )
    }

    // 使用本地 API 搜索专辑
    const searchUrl = `${NETEASE_API_BASE}/search`
    const res = await api.get(searchUrl, {
      params: { keywords: kw, type: 10 },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://music.163.com/',
        Accept: 'application/json',
      },
    })

    const data = res.data

    if (data.code !== 200) {
      return NextResponse.json(
        { error: 'Search failed', details: data },
        { status: 500 },
      )
    }

    const albums = (data.result?.albums || []).map(
      (album: {
        id: number
        name: string
        artist: { id: number; name: string }
        artists: Array<{ id: number; name: string }>
        picId: number
        publishTime: number
        size: number
        copyrightId: number
        pic: number
        picUrl?: string
      }) => ({
        id: album.id,
        name: album.name,
        artist: album.artist?.name || album.artists?.[0]?.name || '未知艺术家',
        // 优先使用 picUrl，如果没有则使用旧的拼接方式
        cover:
          album.picUrl ||
          `https://p2.music.126.net/${album.picId || album.pic}/300.jpg`,
        publishTime: album.publishTime
          ? new Date(album.publishTime).toISOString().split('T')[0]
          : null,
        songCount: album.size,
        url: `https://music.163.com/#/album?id=${album.id}`,
      }),
    )

    return NextResponse.json({ data: albums })
  } catch (error) {
    console.error('Search albums failed:', error)
    return NextResponse.json(
      { error: 'Failed to search albums' },
      { status: 500 },
    )
  }
}
