import { NextRequest, NextResponse } from 'next/server'

import { getNeteasePlaybackUrl } from '@/lib/server/netease-playback'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? ''
  if (!/^\d{1,30}$/.test(id)) {
    return NextResponse.json({ error: '无效的网易云曲目 ID' }, { status: 400 })
  }

  try {
    const keepStoredUrl = request.nextUrl.searchParams.get('keepStoredUrl') === 'true'
    const url = await getNeteasePlaybackUrl(id, keepStoredUrl)
    if (url === undefined)
      return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
    if (!url) return NextResponse.json({ error: '当前账号无法播放完整曲目' }, { status: 404 })
    return NextResponse.json({ data: { url } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: '无法获取网易云播放地址' }, { status: 502 })
  }
}
