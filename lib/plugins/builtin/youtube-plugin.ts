import type { FeaturePlugin, PvVideoResolveOutput } from '../types'

// ═══════════════════════════════════════════════════════════
//  同步工具函数
// ═══════════════════════════════════════════════════════════

/**
 * 将 YouTube URL 转换为嵌入播放地址。
 * 支持 youtube.com/watch、youtu.be、youtube.com/shorts 格式。
 * 非 YouTube URL 返回空字符串。
 */
export function toYouTubeEmbedUrl(url: string): string {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/i,
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/shorts\/([^?&/]+)/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
  }

  return ''
}

/** 从 YouTube URL 提取缩略图 */
export function getYouTubeCover(url: string): string {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/i,
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/shorts\/([^?&/]+)/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) {
      return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`
    }
  }

  return ''
}

/** 判断 URL 是否为 YouTube 链接 */
export function isYouTubeUrl(url: string): boolean {
  return (
    url.includes('youtube.com/watch') ||
    url.includes('youtu.be/') ||
    url.includes('youtube.com/shorts/')
  )
}

// ═══════════════════════════════════════════════════════════
//  插件定义
// ═══════════════════════════════════════════════════════════

export const youtubePlugin: FeaturePlugin = {
  id: 'youtube',
  name: 'YouTube 播放支持',
  description: '解析 YouTube 视频链接，生成嵌入播放地址',
  icon: 'Youtube',
  version: '1.0.0',
  type: 'feature',
  hooks: ['pv:video-resolve'],
  defaultEnabled: true,

  handlers: {
    'pv:video-resolve': async (ctx): Promise<PvVideoResolveOutput | null> => {
      const { url } = ctx
      if (!url) return null

      const embedUrl = toYouTubeEmbedUrl(url)
      if (embedUrl) {
        return { embedUrl }
      }

      return null
    },
  },
}
