import { NextRequest, NextResponse } from 'next/server'

import { VNDBClient } from '@/lib/vndb-client'

const normalizeVnId = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (/^v\d+$/i.test(trimmed)) {
    return `v${trimmed.slice(1)}`
  }

  if (/^\d+$/.test(trimmed)) {
    return `v${trimmed}`
  }

  return ''
}

const searchVndb = async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as {
    keyword?: string
  }
  const keyword = (body.keyword || '').trim()
  const offset = Number(req.nextUrl.searchParams.get('offset') || '0')
  const limit = Number(req.nextUrl.searchParams.get('limit') || '10')

  if (!keyword) {
    return NextResponse.json({ results: [], count: 0, more: false })
  }

  const res = await VNDBClient.request({
    method: 'POST',
    url: '/vn',
    data: {
      filters: ['search', '=', keyword],
      fields: 'title, alttitle, released, developers{name}',
      sort: 'searchrank',
      results: Math.max(1, Math.min(limit, 50)),
      page: Math.floor(Math.max(0, offset) / Math.max(1, limit)) + 1,
      count: true,
    },
  })

  return NextResponse.json(res.data)
}

const getVndbById = async (req: NextRequest) => {
  const rawId = req.nextUrl.searchParams.get('id') || ''
  const vnId = normalizeVnId(rawId)

  if (!vnId) {
    return NextResponse.json({ error: 'Invalid id parameter' }, { status: 400 })
  }

  const res = await VNDBClient.request({
    method: 'POST',
    url: '/vn',
    data: {
      filters: ['id', '=', vnId],
      fields:
        'title, alttitle, aliases, released, image.url, description, tags{name}, developers{name}, platforms, extlinks{label,url}',
      results: 1,
    },
  })

  const payload = res.data as { results?: unknown[] }
  const item = payload.results?.[0]

  if (!item) {
    return NextResponse.json({ error: 'VNDB entry not found' }, { status: 404 })
  }

  return NextResponse.json(item)
}

export const POST = searchVndb
export const GET = getVndbById
