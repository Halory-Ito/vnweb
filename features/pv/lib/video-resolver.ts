import { resolvePvShortLinkApi } from '@/api/pv'

export type ResolvedPvVideo = {
  /** iframe 嵌入地址（如 Bilibili / YouTube embed） */
  embedUrl?: string
  /** 解析后的直链地址 */
  resolvedUrl?: string
}

// ── Bilibili ──────────────────────────────────────────────

function parseHttpUrl(value: string) {
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url
  } catch {
    return null
  }
}

function isBilibiliHost(hostname: string) {
  return hostname === 'bilibili.com' || hostname.endsWith('.bilibili.com')
}

export function isBilibiliUrl(value: string): boolean {
  const url = parseHttpUrl(value)
  return Boolean(
    url &&
    (url.hostname === 'b23.tv' ||
      (isBilibiliHost(url.hostname) && url.pathname.startsWith('/video/')) ||
      (url.hostname === 'player.bilibili.com' && url.pathname === '/player.html')),
  )
}

function getBilibiliEmbedUrl(value: string): string | null {
  const url = parseHttpUrl(value)
  if (!url || !isBilibiliUrl(value) || !isBilibiliHost(url.hostname)) return null

  const pathId = url.pathname.split('/')[2]
  const player = url.hostname === 'player.bilibili.com' && url.pathname === '/player.html'
  const bvid = player ? url.searchParams.get('bvid') || url.searchParams.get('bv') : pathId
  const aid = player ? url.searchParams.get('aid') : /^av(\d+)$/i.exec(pathId ?? '')?.[1]
  const embed = new URL('https://player.bilibili.com/player.html')

  if (bvid && /^BV[a-z0-9]+$/i.test(bvid)) {
    embed.searchParams.set('bvid', bvid)
  } else if (aid && /^\d+$/.test(aid)) {
    embed.searchParams.set('aid', aid)
  } else {
    return null
  }

  for (const key of ['p', 'cid'] as const) {
    const param = url.searchParams.get(key)
    if (param && /^[1-9]\d*$/.test(param)) embed.searchParams.set(key, param)
  }
  embed.searchParams.set('autoplay', '0')
  return embed.href
}

export async function resolvePvShortUrl(url: string): Promise<string | null> {
  if (parseHttpUrl(url)?.hostname !== 'b23.tv') return null
  try {
    const response = await resolvePvShortLinkApi(url)
    const resolvedUrl = response.data?.resolvedUrl ?? null
    return resolvedUrl && getBilibiliEmbedUrl(resolvedUrl) ? resolvedUrl : null
  } catch {
    return null
  }
}

// ── YouTube ───────────────────────────────────────────────

const YOUTUBE_PATTERNS = [
  /youtube\.com\/watch\?v=([^&]+)/i,
  /youtu\.be\/([^?&/]+)/i,
  /youtube\.com\/shorts\/([^?&/]+)/i,
]

export function toYouTubeEmbedUrl(url: string): string {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern)
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
  }
  return ''
}

export function getYouTubeCover(url: string): string {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern)
    if (match?.[1]) {
      return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`
    }
  }
  return ''
}

export function isYouTubeUrl(url: string): boolean {
  return (
    url.includes('youtube.com/watch') ||
    url.includes('youtu.be/') ||
    url.includes('youtube.com/shorts/')
  )
}

// ── Steam & 通用视频流 ────────────────────────────────────

export function isSteamVideoUrl(url: string): boolean {
  return (
    url.includes('steamstatic.com/') ||
    url.includes('steamcdn-a.akamaihd.net/') ||
    url.includes('steamcommunity.com/') ||
    url.includes('store.steampowered.com/')
  )
}

export function isVideoStreamUrl(url: string): boolean {
  return /\.(m3u8|mpd|ism|isml)(?:$|[?#])/i.test(url)
}

function extractSteamVideoUrl(url: string): string | null {
  if (
    (url.includes('steamstatic.com/') || url.includes('steamcdn-a.akamaihd.net/')) &&
    /\.(mp4|webm|m3u8)(?:$|[?#])/i.test(url)
  ) {
    return url
  }
  return null
}

// ── 统一视频解析入口 ──────────────────────────────────────

export async function resolvePvVideoUrl(url: string): Promise<ResolvedPvVideo | null> {
  if (!url) return null

  if (isBilibiliUrl(url)) {
    const targetUrl = parseHttpUrl(url)?.hostname === 'b23.tv' ? await resolvePvShortUrl(url) : url
    const embedUrl = targetUrl && getBilibiliEmbedUrl(targetUrl)
    if (embedUrl) return { embedUrl }
  }

  const ytEmbed = toYouTubeEmbedUrl(url)
  if (ytEmbed) return { embedUrl: ytEmbed }

  if (isSteamVideoUrl(url)) {
    const steamVideo = extractSteamVideoUrl(url)
    if (steamVideo) return { resolvedUrl: steamVideo }
  }

  if (isVideoStreamUrl(url)) {
    return { resolvedUrl: url }
  }

  return null
}
