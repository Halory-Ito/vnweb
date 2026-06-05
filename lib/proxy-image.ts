/**
 * 生成图片代理 URL，避免浏览器扩展阻止第三方图片请求
 * @param url 原始图片 URL
 * @returns 代理后的 URL
 */
export function getProxyImageUrl(url: string): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url)

    // 只代理特定域名的图片
    const allowedDomains = [
      'store.ymgal.games',
      'avatars.steamstatic.com',
      'cdn.akamai.steamstatic.com',
      'bgm.tv',
      'lain.bgm.tv',
    ]

    if (!allowedDomains.some((domain) => urlObj.hostname.endsWith(domain))) {
      return url
    }

    return `/api/proxy-image?url=${encodeURIComponent(url)}`
  } catch {
    return url
  }
}
