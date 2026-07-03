import type { FeaturePlugin, PvVideoResolveOutput } from '../types'

// ═══════════════════════════════════════════════════════════
//  同步工具函数
// ═══════════════════════════════════════════════════════════

/** 判断 URL 是否为 Steam 视频链接 */
export function isSteamVideoUrl(url: string): boolean {
  return (
    url.includes('steamstatic.com/') ||
    url.includes('steamcdn-a.akamaihd.net/') ||
    url.includes('steamcommunity.com/') ||
    url.includes('store.steampowered.com/')
  )
}

/** 判断 URL 是否为可直接播放的视频流（m3u8、mpd 等） */
export function isVideoStreamUrl(url: string): boolean {
  return /\.(m3u8|mpd|ism|isml)(?:$|[?#])/i.test(url)
}

/** 从 Steam 页面提取视频 URL */
function extractSteamVideoUrl(url: string): string | null {
  // Steam trailer/microtrailer 直链
  if (url.includes('steamstatic.com/') || url.includes('steamcdn-a.akamaihd.net/')) {
    // 如果已经是视频文件链接，直接返回
    if (/\.(mp4|webm|m3u8)(?:$|[?#])/i.test(url)) {
      return url
    }
  }
  return null
}

// ═══════════════════════════════════════════════════════════
//  插件定义
// ═══════════════════════════════════════════════════════════

export const genericVideoPlugin: FeaturePlugin = {
  id: 'generic-video',
  name: '通用视频播放支持',
  description: '支持 Steam 等平台的视频链接播放',
  icon: 'Video',
  version: '1.0.0',
  type: 'feature',
  hooks: ['pv:video-resolve'],
  defaultEnabled: true,

  handlers: {
    'pv:video-resolve': async (ctx): Promise<PvVideoResolveOutput | null> => {
      const { url } = ctx
      if (!url) return null

      // Steam 视频链接
      if (isSteamVideoUrl(url)) {
        const videoUrl = extractSteamVideoUrl(url)
        if (videoUrl) {
          return { resolvedUrl: videoUrl }
        }
      }

      // 其他可直接播放的视频流
      if (isVideoStreamUrl(url)) {
        return { resolvedUrl: url }
      }

      return null
    },
  },
}
