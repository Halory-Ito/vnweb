import { NextRequest, NextResponse } from 'next/server'

import { NETEASE_API_BASE, NETEASE_COOKIE } from '@/app/config'
import { api } from '@/lib/request-utils'
/**
 * 获取网易云音乐歌曲真实 URL
 * 使用 /song/url/v1 接口
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const level = searchParams.get('level') || 'exhigh'

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 },
      )
    }

    // 解析多个 ID（用逗号分隔）
    const ids = id
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean)

    // 调用歌曲 URL API，单个 ID 直接传递，多个 ID 用逗号分隔
    const apiUrl = `${NETEASE_API_BASE}/song/url/v1`

    const res = await api.get(apiUrl, {
      params: {
        id: ids.join(','),
        level,
        cookie: NETEASE_COOKIE,
      },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://music.163.com/',
        Accept: 'application/json',
      },
    })

    const data = res.data

    // 检查返回的 code
    if (data.code !== 200) {
      console.error('API returned error code:', data.code, data)
      return NextResponse.json(
        {
          error: data.message || '获取歌曲 URL 失败',
          details: data,
          code: data.code,
        },
        { status: 500 },
      )
    }

    // 返回歌曲 URL 列表，保留原始数据
    const urls = (data.data || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      url: item.url || '',
      br: item.br,
      size: item.size,
      md5: item.md5,
      type: item.type,
      level: item.level,
      encodeType: item.encodeType,
      fee: item.fee,
      // 如果 URL 为空则标记为不可用
      available: !!item.url,
    }))

    return NextResponse.json({ data: urls })
  } catch (error) {
    console.error('Get song url failed:', error)
    return NextResponse.json(
      { error: 'Failed to get song url' },
      { status: 500 },
    )
  }
}
