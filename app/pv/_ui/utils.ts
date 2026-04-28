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

export const getYouTubeCover = (url: string) => {
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

export const isHlsUrl = (url: string) => /\.m3u8(?:$|[?#])/i.test(url)

export const toYouTubeEmbedUrl = (url: string) => {
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

export const toBilibiliEmbedUrl = (url: string) => {
  const bvMatch = url.match(
    /(?:bilibili\.com\/video\/|player\.bilibili\.com\/player\.html\?.*(?:bvid|bv)=)(BV[a-zA-Z0-9]+)/i,
  )
  const p = url.match(/p=(\d+)/i)?.[1] || '1'
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

export const isEmbedVideoUrl = (url: string) =>
  Boolean(toYouTubeEmbedUrl(url) || toBilibiliEmbedUrl(url))
