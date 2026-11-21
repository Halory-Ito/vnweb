import type { FeaturePlugin, PvVideoResolveOutput } from '../types'

function parseBilibiliUrl(value: string) {
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
  const url = parseBilibiliUrl(value)
  return Boolean(
    url &&
    (url.hostname === 'b23.tv' ||
      (isBilibiliHost(url.hostname) && url.pathname.startsWith('/video/')) ||
      (url.hostname === 'player.bilibili.com' && url.pathname === '/player.html')),
  )
}

function getEmbedUrl(value: string): string | null {
  const url = parseBilibiliUrl(value)
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

async function resolveB23ShortLink(shortUrl: string): Promise<string | null> {
  if (parseBilibiliUrl(shortUrl)?.hostname !== 'b23.tv') return null
  try {
    const res = await fetch(shortUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(5_000),
    })
    return getEmbedUrl(res.url) ? res.url : null
  } catch {
    return null
  }
}

export const bilibiliPlugin: FeaturePlugin = {
  id: 'bilibili',
  name: 'Bilibili 播放支持',
  description: '通过哔哩哔哩官方外链播放器预览视频，支持 b23.tv 短链',
  icon: 'Tv',
  version: '2.0.0',
  type: 'feature',
  hooks: ['pv:video-resolve', 'pv:resolve-url'],
  defaultEnabled: true,

  handlers: {
    'pv:video-resolve': async ({ url }): Promise<PvVideoResolveOutput | null> => {
      if (!url || !isBilibiliUrl(url)) return null

      const targetUrl =
        parseBilibiliUrl(url)?.hostname === 'b23.tv' ? await resolveB23ShortLink(url) : url
      const embedUrl = targetUrl && getEmbedUrl(targetUrl)
      return embedUrl ? { embedUrl } : null
    },
    'pv:resolve-url': async ({ url }) => {
      const resolvedUrl = url && (await resolveB23ShortLink(url))
      return resolvedUrl ? { resolvedUrl } : null
    },
  },
}
