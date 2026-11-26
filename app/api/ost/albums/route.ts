import { NextRequest, NextResponse } from 'next/server'

import { searchNeteaseAlbums } from '@/lib/server/netease-albums'

function parsePositiveIntParam(raw: string | null, fallback: number, max: number): number | null {
  if (raw === null || raw.trim() === '') return fallback
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const value = Number(trimmed)
  if (!Number.isSafeInteger(value) || value < 1 || value > max) return null
  return value
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const keyword = searchParams.get('keyword')?.trim() || ''
  if (!keyword || keyword.length > 200)
    return NextResponse.json({ error: '请输入 1–200 字的专辑关键词' }, { status: 400 })

  const page = parsePositiveIntParam(searchParams.get('page'), 1, 1000)
  const pageSize = parsePositiveIntParam(searchParams.get('pageSize'), 30, 100)
  if (page === null || pageSize === null) {
    return NextResponse.json({ error: '无效的分页参数' }, { status: 400 })
  }

  try {
    return NextResponse.json({ data: await searchNeteaseAlbums(keyword, { page, pageSize }) })
  } catch {
    return NextResponse.json({ error: '专辑搜索暂时不可用，请稍后重试' }, { status: 502 })
  }
}
