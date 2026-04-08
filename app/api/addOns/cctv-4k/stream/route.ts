import { NextResponse } from 'next/server'

function toProxyUrl(url: string) {
  return `/api/addOns/cctv-4k/stream?url=${encodeURIComponent(url)}`
}

function rewriteM3U8Content(content: string, sourceUrl: string) {
  return content
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#')) {
        return line
      }

      try {
        const absoluteUrl = new URL(trimmed, sourceUrl).toString()
        return toProxyUrl(absoluteUrl)
      } catch {
        return line
      }
    })
    .join('\n')
}

function isM3U8Response(contentType: string | null, url: string) {
  if (contentType?.toLowerCase().includes('application/vnd.apple.mpegurl')) {
    return true
  }

  if (contentType?.toLowerCase().includes('application/x-mpegurl')) {
    return true
  }

  return /\.m3u8($|[?#])/i.test(url)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')?.trim() || ''

    if (!/^https?:\/\//i.test(targetUrl)) {
      return NextResponse.json(
        { error: 'Invalid stream url' },
        {
          status: 400,
        },
      )
    }

    const upstream = await fetch(targetUrl, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'user-agent': 'VNWeb-CCTV4K-Addon/1.0',
      },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream request failed (${upstream.status})` },
        { status: upstream.status },
      )
    }

    const contentType = upstream.headers.get('content-type')

    if (isM3U8Response(contentType, targetUrl)) {
      const raw = await upstream.text()
      const rewritten = rewriteM3U8Content(raw, targetUrl)

      return new Response(rewritten, {
        status: 200,
        headers: {
          'cache-control': 'no-store',
          'content-type': 'application/vnd.apple.mpegurl; charset=utf-8',
        },
      })
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'cache-control': 'no-store',
        'content-type': contentType || 'application/octet-stream',
      },
    })
  } catch (error) {
    console.error('CCTV stream proxy failed:', error)
    return NextResponse.json(
      { error: 'Failed to proxy stream' },
      { status: 500 },
    )
  }
}
