const PREVIEW_PROXY_ALLOWED_HOSTS = new Set(['cdn.thegamesdb.net'])

/** 校验远程图片地址是否属于受控同源预览白名单。 */
export function isPreviewProxyAllowedUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim()
  if (!trimmed || !URL.canParse(trimmed)) return false

  const parsed = new URL(trimmed)
  if (parsed.protocol !== 'https:') return false
  if (parsed.username || parsed.password || parsed.port !== '') return false

  return PREVIEW_PROXY_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())
}

/** 对拦截浏览器跨站外链的图源生成本地同源预览地址，其余链接原样返回。 */
export function buildGameImagePreviewUrl(url: string): string {
  const trimmed = url.trim()
  if (!isPreviewProxyAllowedUrl(trimmed)) return trimmed
  return `/api/game/image-preview?url=${encodeURIComponent(trimmed)}`
}
