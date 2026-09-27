export const toDisplayDate = (value: string | null) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString('zh-CN', { hour12: false })
}

export const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return '未知来源'
  }
}

export const isHlsUrl = (url: string) => /\.m3u8(?:$|[?#])/i.test(url)

/** 判断 URL 是否为可直接播放的视频文件链接 */
export const isVideoFileUrl = (url: string): boolean => {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return /\.(mp4|webm|ogg|mov|mkv|avi|m4v)(?:$|[?#])/i.test(pathname)
  } catch {
    return /\.(mp4|webm|ogg|mov|mkv|avi|m4v)(?:$|[?#])/i.test(url)
  }
}

// 以下函数已迁移到 lib/plugins/builtin/，通过插件系统重新导出
export { toYouTubeEmbedUrl, getYouTubeCover } from '@/lib/plugins'
export { isBilibiliUrl } from '@/lib/plugins'
export { isSteamVideoUrl, isVideoStreamUrl } from '@/lib/plugins'
