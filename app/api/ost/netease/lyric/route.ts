import { NextRequest, NextResponse } from 'next/server'

import { getNeteaseLyric } from '@/lib/server/netease-playback'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? ''
  if (!/^\d{1,30}$/.test(id)) {
    return NextResponse.json({ error: '无效的网易云曲目 ID' }, { status: 400 })
  }

  try {
    const lyric = await getNeteaseLyric(id)
    return new NextResponse(lyric, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: '无法获取网易云歌词' }, { status: 502 })
  }
}
