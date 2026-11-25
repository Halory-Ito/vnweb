import axios from 'axios'

import { type GameImageType } from '@/lib/game-image-sources'
import { VNDBClient } from '@/lib/vndb-client'

import type { GameSearchImageItem } from '@/types/game'

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
export const APP_USER_AGENT = 'VNWeb/1.0 (+https://github.com/Halory-Ito/vnweb)'
export const REQUEST_TIMEOUT_MS = 10_000
export const CDN_HEAD_TIMEOUT_MS = 4_000
export const MAX_RESULT_ITEMS = 30

export type ImageSearchResult = {
  game: { id: string | number; name: string } | null
  items: GameSearchImageItem[]
}

const UNSUPPORTED_MEDIA_EXT_RE = /\.(mp4|webm|swf|zip)$/i

export const hasCjk = (value: string) => /[\u3040-\u30ff\u3400-\u9fff]/.test(value)

export const normalizeTagCandidate = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, '_')

export const trimTrailingSlash = (url: string, fallback = '') =>
  url.trim().replace(/\/+$/, '') || fallback

export const isSupportedImageUrl = (url: string): boolean => {
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    return !UNSUPPORTED_MEDIA_EXT_RE.test(new URL(trimmed).pathname)
  } catch {
    return !UNSUPPORTED_MEDIA_EXT_RE.test(trimmed.split(/[?#]/)[0] || '')
  }
}

export const finalizeItems = (items: GameSearchImageItem[]): GameSearchImageItem[] => {
  const seen = new Set<string>()
  const result: GameSearchImageItem[] = []
  for (const item of items) {
    const url = item.url.trim()
    if (!url || !isSupportedImageUrl(url) || seen.has(url)) continue
    seen.add(url)
    result.push({ ...item, url, thumb: (item.thumb || url).trim() })
    if (result.length >= MAX_RESULT_ITEMS) break
  }
  return result
}

export const sortByImageType = (
  items: GameSearchImageItem[],
  imageType: GameImageType,
): GameSearchImageItem[] => {
  if (imageType !== 'bg' && imageType !== 'cover') return items

  return [...items].sort((a, b) => {
    const aPreferred = imageType === 'bg' ? a.width >= a.height : a.height >= a.width
    const bPreferred = imageType === 'bg' ? b.width >= b.height : b.height >= b.width
    if (aPreferred !== bPreferred) return aPreferred ? -1 : 1
    return b.width * b.height - a.width * a.height
  })
}

export const probeImageExists = async (url: string): Promise<boolean> => {
  try {
    const res = await axios.head(url, {
      timeout: CDN_HEAD_TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: (status) => status >= 200 && status < 400,
    })
    return res.status >= 200 && res.status < 300
  } catch {
    return false
  }
}

/** 将中文/日文游戏名经 VNDB 补充为英文或罗马音检索候选。 */
export const resolveSearchCandidates = async (keyword: string): Promise<string[]> => {
  const candidates = [keyword]
  if (!hasCjk(keyword)) return candidates

  try {
    const res = await VNDBClient.post<{
      results?: Array<{ title?: string; alttitle?: string | null }>
    }>('/vn', {
      filters: ['search', '=', keyword],
      fields: 'title, alttitle',
      sort: 'searchrank',
      results: 3,
    })
    for (const entry of res.data.results ?? []) {
      if (entry.title) candidates.push(entry.title)
    }
  } catch {
    // 兜底查询失败时保留原始关键词
  }

  return Array.from(new Set(candidates.map((item) => item.trim()).filter(Boolean)))
}

export function formatUpstreamError(error: unknown, platformName: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      return new Error(`${platformName} 鉴权失败（${status}），请检查 API Key 或账号凭据配置`)
    }
    if (status === 429) {
      return new Error(`${platformName} 请求频率受限（429），请稍后重试`)
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new Error(`${platformName} 请求超时，请检查网络连接或接口地址`)
    }
  }
  if (error instanceof Error) return error
  return new Error(`${platformName} 搜索图片失败`)
}
