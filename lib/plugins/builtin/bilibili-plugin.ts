import type { FeaturePlugin, PvVideoResolveOutput } from '../types'

// ═══════════════════════════════════════════════════════════
//  同步工具函数（供 PV 播放等场景直接调用）
// ═══════════════════════════════════════════════════════════

/** 判断 URL 是否为 B 站链接（含 b23.tv 短链） */
export function isBilibiliUrl(url: string): boolean {
  return (
    url.includes('b23.tv/') ||
    url.includes('bilibili.com/video/') ||
    url.includes('player.bilibili.com/')
  )
}

// ═══════════════════════════════════════════════════════════
//  内部工具
// ═══════════════════════════════════════════════════════════

/** 从 URL 中提取 BV 号或 AV 号 */
function extractBiliId(url: string): { type: 'bv' | 'av'; id: string; p: string } | null {
  const p = url.match(/[?&]p=(\d+)/i)?.[1] || '1'

  // BV 号
  const bvMatch = url.match(
    /(?:bilibili\.com\/video\/|player\.bilibili\.com\/player\.html\?.*(?:bvid|bv)=)(BV[a-zA-Z0-9]+)/i,
  )
  if (bvMatch?.[1]) {
    return { type: 'bv', id: bvMatch[1], p }
  }

  // AV 号
  const avMatch = url.match(
    /(?:bilibili\.com\/video\/av|player\.bilibili\.com\/player\.html\?.*aid=)(\d+)/i,
  )
  if (avMatch?.[1]) {
    return { type: 'av', id: avMatch[1], p }
  }

  return null
}

/** 通过 bilibili-parse API 解析视频真实地址 */
async function resolveBilibiliVideo(
  biliId: { type: 'bv' | 'av'; id: string; p: string },
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      [biliId.type]: biliId.id,
      p: biliId.p,
      q: '64',
      format: 'mp4',
      otype: 'json',
    })

    const res = await fetch(`https://api.injahow.cn/bparse/?${params.toString()}`)
    if (!res.ok) return null

    const data = await res.json()
    // API 返回的 url 字段就是视频真实地址
    return data?.url || null
  } catch {
    return null
  }
}

/** 解析 b23.tv 短链为完整 URL */
async function resolveB23ShortLink(shortUrl: string): Promise<string | null> {
  try {
    const res = await fetch(shortUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(5_000),
    })
    return res.url || null
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════
//  插件定义
// ═══════════════════════════════════════════════════════════

export const bilibiliPlugin: FeaturePlugin = {
  id: 'bilibili',
  name: 'Bilibili 播放支持',
  description: '解析 B 站视频链接（含 b23.tv 短链），通过 bilibili-parse 获取真实播放地址',
  icon: 'Tv',
  version: '2.0.0',
  type: 'feature',
  hooks: ['pv:video-resolve', 'pv:resolve-url'],
  defaultEnabled: true,

  handlers: {
    // ── 视频解析：解析为可播放的直链地址 ──────────────────
    'pv:video-resolve': async (ctx): Promise<PvVideoResolveOutput | null> => {
      const { url } = ctx
      if (!url) return null

      // b23.tv 短链 → 先解析为完整 URL
      let targetUrl = url
      if (url.includes('b23.tv/')) {
        const resolved = await resolveB23ShortLink(url)
        if (resolved) {
          targetUrl = resolved
        }
      }

      // 提取 BV/AV 号
      const biliId = extractBiliId(targetUrl)
      if (!biliId) return null

      // 通过 bilibili-parse API 解析真实播放地址
      const videoUrl = await resolveBilibiliVideo(biliId)
      if (videoUrl) {
        return { resolvedUrl: videoUrl }
      }

      return null
    },

    // ── URL 解析：输入时自动解析短链 ─────────────────────
    'pv:resolve-url': async (ctx) => {
      const { url } = ctx
      if (!url?.includes('b23.tv/')) return null

      const resolved = await resolveB23ShortLink(url)
      if (
        resolved &&
        (resolved.includes('bilibili.com') || resolved.includes('b23.tv'))
      ) {
        return { resolvedUrl: resolved }
      }
      return null
    },
  },
}
