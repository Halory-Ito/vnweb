import { NextRequest, NextResponse } from 'next/server'

import { searchNeteaseAlbums } from '@/lib/server/netease-albums'

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword')?.trim() || ''
  if (!keyword || keyword.length > 200)
    return NextResponse.json({ error: '请输入 1–200 字的专辑关键词' }, { status: 400 })
  try {
    return NextResponse.json({ data: await searchNeteaseAlbums(keyword) })
  } catch {
    return NextResponse.json({ error: '专辑搜索暂时不可用，请稍后重试' }, { status: 502 })
  }
}
