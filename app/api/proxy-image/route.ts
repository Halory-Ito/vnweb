import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // 验证 URL 格式
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 })
  }

  // 只允许特定域名的图片代理
  const allowedDomains = [
    'store.ymgal.games',
    'avatars.steamstatic.com',
    'cdn.akamai.steamstatic.com',
    'bgm.tv',
    'lain.bgm.tv',
  ]

  const urlObj = new URL(url)
  if (!allowedDomains.some((domain) => urlObj.hostname.endsWith(domain))) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vnweb/1.0',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status },
      )
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (error) {
    console.error('Proxy image error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 },
    )
  }
}
