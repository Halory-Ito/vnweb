import type { FeaturePlugin, PvVideoResolveOutput } from '../types'

// ═══════════════════════════════════════════════════════════
//  同步工具函数（供 PV 播放等场景直接调用）
// ═══════════════════════════════════════════════════════════

/**
 * 将 Bilibili URL 转换为嵌入播放地址。
 * 支持 bilibili.com/video/BV...、av... 和 player.bilibili.com 格式。
 * 非 Bilibili URL 返回空字符串。
 */
export function toBilibiliEmbedUrl(url: string): string {
  const p = url.match(/p=(\d+)/i)?.[1] || '1'

  const bvMatch = url.match(
    /(?:bilibili\.com\/video\/|player\.bilibili\.com\/player\.html\?.*(?:bvid|bv)=)(BV[a-zA-Z0-9]+)/i,
  )
  if (bvMatch?.[1]) {
    return `https://api.injahow.cn/bparse/?bv=${bvMatch[1]}&p=${p}&q=80&otype=dplayer`
  }

  const avMatch = url.match(
    /(?:bilibili\.com\/video\/av|player\.bilibili\.com\/player\.html\?.*aid=)(\d+)/i,
  )
  if (avMatch?.[1]) {
    return `https://api.injahow.cn/bparse/?av=${avMatch[1]}&p=${p}&q=80&otype=dplayer`
  }

  return ''
}

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

async function resolveB23ShortLink(shortUrl: string): Promise<string | null> {
  try {
    const res = await fetch(shortUrl, { method: 'HEAD', redirect: 'follow' })
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
  description: '解析 B 站视频链接（含 b23.tv 短链），生成嵌入播放地址',
  icon: 'Tv',
  version: '1.0.0',
  type: 'feature',
  hooks: ['pv:video-resolve', 'pv:resolve-url'],
  defaultEnabled: true,

  handlers: {
    // ── 视频解析：判断是否能处理 + 解析为可播放地址 ──────
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

      // 判断是否为 B 站链接
      if (
        targetUrl.includes('bilibili.com/video/') ||
        targetUrl.includes('player.bilibili.com/')
      ) {
        const embedUrl = toBilibiliEmbedUrl(targetUrl)
        if (embedUrl) {
          return { embedUrl, resolvedUrl: targetUrl }
        }
      }

      return null
    },

    // ── URL 解析：输入时自动解析短链 ─────────────────────
    'pv:resolve-url': async (ctx) => {
      const { url } = ctx
      if (!url?.includes('b23.tv/')) return null

      const resolved = await resolveB23ShortLink(url)
      if (resolved && (resolved.includes('bilibili.com') || resolved.includes('b23.tv'))) {
        return { resolvedUrl: resolved }
      }
      return null
    },
  },
}
