import { NextRequest, NextResponse } from 'next/server'

import { api } from '@/lib/request-utils'

export async function GET(req: NextRequest) {
  try {
    const keyword = req.nextUrl.searchParams.get('keyword')
    const direction = req.nextUrl.searchParams.get('direction')

    if (!keyword) {
      return NextResponse.json({ error: '缺少搜索关键词' }, { status: 400 })
    }

    // 根据方向确定搜索哪个资源
    const targetResource =
      direction === 'khinsider-to-netease' ? 'netease' : 'khinsider'

    try {
      let items: Array<{
        id: string
        name: string
        cover: string
        songs?: Array<{
          id: number
          name: string
          url: string
          lyricsText?: string
          lyricsPath?: string
        }>
      }> = []

      if (targetResource === 'netease') {
        // 调用网易云专辑搜索 API
        const neteaseResponse = await api.get('/ost/netease', {
          params: { kw: keyword },
        })
        items = (neteaseResponse.data.data || []).map(
          (album: { id: number; name: string; cover: string }) => ({
            id: String(album.id),
            name: album.name,
            cover: album.cover,
            songs: [],
          }),
        )
      } else {
        // 调用 Khinsider 搜索
        const khinsiderResponse = await api.get('/ost/khinsider', {
          params: { kw: keyword },
        })
        items = (khinsiderResponse.data.data || []).map(
          (album: { name: string; url: string; cover: string }) => ({
            id: album.url,
            name: album.name,
            cover: album.cover,
            songs: [],
          }),
        )
      }

      return NextResponse.json({
        data: {
          items,
        },
      })
    } catch (fetchError) {
      console.error('Search service error:', fetchError)
      return NextResponse.json({
        data: {
          items: [],
        },
      })
    }
  } catch (error) {
    console.error('Search convert failed:', error)
    return NextResponse.json({ error: '搜索失败' }, { status: 500 })
  }
}
