import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

import {
  YMGAL_BASE_URL,
  YMGAL_CLIENT_ID,
  YMGAL_CLIENT_SECRET,
} from '@/app/config'

// ── Token 缓存 ────────────────────────────────────────────
let cachedToken: string | null = null
let tokenExpiresAt = 0

const getToken = async (): Promise<string> => {
  const now = Date.now()
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken
  }

  const res = await axios.get(`${YMGAL_BASE_URL}/oauth/token`, {
    params: {
      grant_type: 'client_credentials',
      client_id: YMGAL_CLIENT_ID,
      client_secret: YMGAL_CLIENT_SECRET,
      scope: 'public',
    },
  })

  const data = res.data as {
    access_token?: string
    expires_in?: number
  }

  if (!data.access_token) {
    throw new Error('YMGal: Failed to obtain access token')
  }

  cachedToken = data.access_token
  // 提前 60 秒过期，避免边界情况
  tokenExpiresAt = now + (data.expires_in ?? 3600) * 1000 - 60_000
  return cachedToken
}

const ymgalRequest = async (
  path: string,
  params: Record<string, string | number>,
) => {
  const token = await getToken()
  const res = await axios.get(`${YMGAL_BASE_URL}${path}`, {
    params,
    headers: {
      Accept: 'application/json;charset=utf-8',
      Authorization: `Bearer ${token}`,
      version: '1',
    },
  })
  return res.data
}

// ── 搜索游戏列表 ──────────────────────────────────────────
const searchGameList = async (req: NextRequest) => {
  const params = req.nextUrl.searchParams
  const keyword = params.get('keyword') ?? ''
  const pageNum = Number(params.get('pageNum') ?? '1')
  const pageSize = Number(params.get('pageSize') ?? '10')

  if (!keyword.trim()) {
    return NextResponse.json(
      { success: false, code: 614, msg: 'keyword is required' },
      { status: 400 },
    )
  }

  try {
    const data = await ymgalRequest('/open/archive/search-game', {
      mode: 'list',
      keyword: keyword.trim(),
      pageNum,
      pageSize,
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('YMGal search list failed:', error)
    return NextResponse.json(
      { success: false, code: 50, msg: 'YMGal search failed' },
      { status: 500 },
    )
  }
}

// ── 精确搜索 / 查询游戏详情 ───────────────────────────────
const getGameDetail = async (req: NextRequest) => {
  const params = req.nextUrl.searchParams
  const rawGid = params.get('gid')
  const keyword = params.get('keyword')

  try {
    // 按 gid 查询详情 — 使用 /open/archive 端点
    if (rawGid) {
      // 支持 "ga35200" 和 "35200" 两种格式
      const numericGid = rawGid.replace(/^[Gg][Aa]/, '').trim()
      if (!numericGid || !/^\d+$/.test(numericGid)) {
        return NextResponse.json(
          { success: false, code: 614, msg: 'gid 格式不正确' },
          { status: 400 },
        )
      }
      const data = await ymgalRequest('/open/archive', { gid: numericGid })
      return NextResponse.json(data)
    }

    // 按 keyword 精确搜索 — 使用 /open/archive/search-game 端点
    if (keyword) {
      const data = await ymgalRequest('/open/archive/search-game', {
        mode: 'accurate',
        keyword: keyword.trim(),
        similarity: 80,
      })
      return NextResponse.json(data)
    }

    return NextResponse.json(
      { success: false, code: 614, msg: 'Missing gid or keyword' },
      { status: 400 },
    )
  } catch (error) {
    console.error('YMGal get game detail failed:', error)
    return NextResponse.json(
      { success: false, code: 50, msg: 'YMGal request failed' },
      { status: 500 },
    )
  }
}

export { searchGameList as POST, getGameDetail as GET }
