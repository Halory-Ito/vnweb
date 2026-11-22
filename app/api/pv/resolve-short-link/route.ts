import { NextResponse } from 'next/server'

const ALLOWED_SHORT_LINK_HOSTS = new Set(['b23.tv'])

function parseAllowedShortLink(raw: unknown): URL | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!ALLOWED_SHORT_LINK_HOSTS.has(url.hostname.toLowerCase())) return null
    return url
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as { url?: unknown }
    const shortUrl = parseAllowedShortLink(payload.url)

    if (!shortUrl) {
      return NextResponse.json({ error: '不支持的短链地址' }, { status: 400 })
    }

    const response = await fetch(shortUrl.href, {
      redirect: 'follow',
      signal: AbortSignal.timeout(5_000),
    })

    return NextResponse.json({ resolvedUrl: response.url || null })
  } catch (error) {
    console.error('Resolve short link failed:', error)
    return NextResponse.json({ resolvedUrl: null })
  }
}
