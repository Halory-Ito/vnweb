import { NextRequest, NextResponse } from 'next/server'

import { searchGuides } from '@/lib/scraper/guide/yj'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  const page = Number(request.nextUrl.searchParams.get('page')) || 1
  const pageSize = Number(request.nextUrl.searchParams.get('pageSize')) || 12

  if (!q) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })
  }

  try {
    const data = await searchGuides(q, page, pageSize)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search guides error:', error)
    return NextResponse.json({ error: 'Failed to search guides' }, { status: 500 })
  }
}
