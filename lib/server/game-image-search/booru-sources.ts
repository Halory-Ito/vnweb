import axios from 'axios'

import {
  APP_USER_AGENT,
  finalizeItems,
  hasCjk,
  isSupportedImageUrl,
  MAX_RESULT_ITEMS,
  normalizeTagCandidate,
  REQUEST_TIMEOUT_MS,
  resolveSearchCandidates,
  formatUpstreamError,
  sortByImageType,
  trimTrailingSlash,
  USER_AGENT,
  type ImageSearchResult,
} from './shared'
import { type GameImageType } from '@/lib/game-image-sources'
import { readPlatformSettings } from '@/lib/server/platform-settings'

import type { GameSearchImageItem } from '@/types/game'

// ── Moebooru (Yande.re / Konachan) ────────────────────────
type MoebooruTag = { name?: string; count?: number; type?: number }
type MoebooruPost = {
  id?: number
  file_url?: string
  jpeg_url?: string
  sample_url?: string
  preview_url?: string
  width?: number
  height?: number
  jpeg_width?: number
  jpeg_height?: number
}

const resolveMoebooruTag = async (origin: string, candidates: string[]): Promise<string | null> => {
  for (const candidate of candidates) {
    const normalized = normalizeTagCandidate(candidate)
    if (!normalized) continue
    try {
      const res = await axios.get<MoebooruTag[]>(`${origin}/tag.json`, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { 'User-Agent': USER_AGENT },
        params: { name: normalized, order: 'count', limit: 10 },
      })
      const tags = Array.isArray(res.data)
        ? res.data.filter((tag) => tag.name && (tag.count ?? 0) > 0)
        : []
      if (tags.length === 0) continue

      const exact = tags.find((tag) => tag.name === normalized)
      if (exact?.name) return exact.name

      const copyrightTag = tags.find((tag) => tag.type === 3)
      if (copyrightTag?.name) return copyrightTag.name
      if (tags[0]?.name) return tags[0].name
    } catch {
      continue
    }
  }
  return null
}

const resolveMoebooruBaseUrl = (
  source: 'yandere' | 'konachan',
  configuredUrl: string,
  allowNsfw: boolean,
): string => {
  const trimmed = trimTrailingSlash(configuredUrl)
  if (source === 'yandere') return trimmed || 'https://yande.re'
  if (!trimmed || trimmed === 'https://konachan.net') {
    return allowNsfw ? 'https://konachan.com' : 'https://konachan.net'
  }
  return trimmed
}

export async function searchMoebooruImages(
  source: 'yandere' | 'konachan',
  keyword: string,
  imageType: GameImageType,
  includeNsfw?: boolean,
): Promise<ImageSearchResult> {
  const settings = await readPlatformSettings()
  const config = settings[source]
  const effectiveAllowNsfw = includeNsfw ?? config.allowNsfw
  const origin = resolveMoebooruBaseUrl(source, config.baseUrl, effectiveAllowNsfw)

  const candidates = await resolveSearchCandidates(keyword)
  const resolvedTag =
    (await resolveMoebooruTag(origin, candidates)) ??
    normalizeTagCandidate(candidates.find((c) => !hasCjk(c)) ?? keyword)

  if (!resolvedTag) return { game: null, items: [] }

  const tagsQuery = effectiveAllowNsfw ? resolvedTag : `${resolvedTag} rating:s`
  const res = await axios.get<MoebooruPost[]>(`${origin}/post.json`, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT },
    params: { tags: tagsQuery, limit: MAX_RESULT_ITEMS },
  })

  const posts = Array.isArray(res.data) ? res.data : []
  if (posts.length === 0) return { game: null, items: [] }

  const items: GameSearchImageItem[] = posts
    .filter((post) => typeof post.id === 'number' && Boolean(post.jpeg_url || post.file_url))
    .map((post) => {
      const url = post.jpeg_url || post.file_url || ''
      return {
        id: `${source}-${post.id}`,
        url,
        thumb: post.preview_url || post.sample_url || url,
        width: Number(post.jpeg_width || post.width || 0),
        height: Number(post.jpeg_height || post.height || 0),
      }
    })

  return {
    game: { id: resolvedTag, name: resolvedTag },
    items: finalizeItems(sortByImageType(items, imageType)),
  }
}

// ── Safebooru (纯全年龄，无需 Key) ────────────────────────
type SafebooruPost = {
  id?: number
  file_url?: string
  sample_url?: string
  preview_url?: string
  width?: number
  height?: number
}

const resolveSafebooruTag = async (
  origin: string,
  candidates: string[],
): Promise<string | null> => {
  for (const candidate of candidates) {
    const normalized = normalizeTagCandidate(candidate)
    if (!normalized) continue
    try {
      const res = await axios.get<Array<{ value?: string }>>(`${origin}/autocomplete.php`, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { 'User-Agent': USER_AGENT },
        params: { q: normalized },
      })
      const entries = Array.isArray(res.data) ? res.data : []
      const exact = entries.find((item) => item.value === normalized)
      if (exact?.value) return exact.value
      if (entries[0]?.value) return entries[0].value
    } catch {
      continue
    }
  }
  return null
}

export async function searchSafebooruImages(
  keyword: string,
  imageType: GameImageType,
): Promise<ImageSearchResult> {
  const settings = await readPlatformSettings()
  const origin = trimTrailingSlash(settings.safebooru.baseUrl, 'https://safebooru.org')
  const candidates = await resolveSearchCandidates(keyword)
  const resolvedTag =
    (await resolveSafebooruTag(origin, candidates)) ??
    normalizeTagCandidate(candidates.find((c) => !hasCjk(c)) ?? keyword)

  if (!resolvedTag) return { game: null, items: [] }

  const res = await axios.get<SafebooruPost[]>(`${origin}/index.php`, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT },
    params: {
      page: 'dapi',
      s: 'post',
      q: 'index',
      json: 1,
      tags: resolvedTag,
      limit: MAX_RESULT_ITEMS,
    },
  })

  const posts = Array.isArray(res.data) ? res.data : []
  if (posts.length === 0) return { game: null, items: [] }

  const items: GameSearchImageItem[] = posts
    .filter((post) => typeof post.id === 'number' && Boolean(post.file_url))
    .map((post) => ({
      id: `safebooru-${post.id}`,
      url: post.file_url!,
      thumb: post.preview_url || post.sample_url || post.file_url!,
      width: Number(post.width ?? 0),
      height: Number(post.height ?? 0),
    }))

  return {
    game: { id: resolvedTag, name: resolvedTag },
    items: finalizeItems(sortByImageType(items, imageType)),
  }
}

// ── Danbooru (需要用户名 + API Key) ───────────────────────
type DanbooruTag = { name?: string; post_count?: number; category?: number }
type DanbooruPost = {
  id?: number
  rating?: string
  file_url?: string
  large_file_url?: string
  preview_file_url?: string
  image_width?: number
  image_height?: number
}

const resolveDanbooruTag = async (
  origin: string,
  candidates: string[],
  headers: Record<string, string>,
): Promise<string | null> => {
  for (const candidate of candidates) {
    const normalized = normalizeTagCandidate(candidate)
    if (!normalized) continue
    try {
      const res = await axios.get<DanbooruTag[]>(`${origin}/tags.json`, {
        timeout: REQUEST_TIMEOUT_MS,
        headers,
        params: {
          'search[name_matches]': `${normalized}*`,
          'search[order]': 'count',
          limit: 10,
        },
      })
      const tags = Array.isArray(res.data)
        ? res.data.filter((tag) => tag.name && (tag.post_count ?? 0) > 0)
        : []
      if (tags.length === 0) continue

      const exact = tags.find((tag) => tag.name === normalized)
      if (exact?.name) return exact.name

      const copyrightTag = tags.find((tag) => tag.category === 3)
      if (copyrightTag?.name) return copyrightTag.name
      if (tags[0]?.name) return tags[0].name
    } catch {
      continue
    }
  }
  return null
}

export async function searchDanbooruImages(
  keyword: string,
  imageType: GameImageType,
  includeNsfw?: boolean,
): Promise<ImageSearchResult> {
  const { danbooru } = await readPlatformSettings()
  const username = danbooru.username.trim()
  const apiKey = danbooru.apiKey.trim()
  if (!username || !apiKey) {
    throw new Error('请先在「设置 → 平台」配置 Danbooru 用户名与 API Key')
  }

  const origin = trimTrailingSlash(danbooru.baseUrl, 'https://danbooru.donmai.us')
  const effectiveAllowNsfw = includeNsfw ?? danbooru.allowNsfw
  const headers = {
    'User-Agent': APP_USER_AGENT,
    Authorization: `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`,
  }

  const candidates = await resolveSearchCandidates(keyword)
  const resolvedTag =
    (await resolveDanbooruTag(origin, candidates, headers)) ??
    normalizeTagCandidate(candidates.find((c) => !hasCjk(c)) ?? keyword)

  if (!resolvedTag) return { game: null, items: [] }

  const tagsQuery = effectiveAllowNsfw ? resolvedTag : `${resolvedTag} rating:g,s`

  try {
    const postsRes = await axios
      .get<DanbooruPost[]>(`${origin}/posts.json`, {
        timeout: REQUEST_TIMEOUT_MS,
        headers,
        params: { tags: tagsQuery, limit: MAX_RESULT_ITEMS },
      })
      .catch(async (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 422 && !effectiveAllowNsfw) {
          return axios.get<DanbooruPost[]>(`${origin}/posts.json`, {
            timeout: REQUEST_TIMEOUT_MS,
            headers,
            params: { tags: `${resolvedTag} rating:g`, limit: MAX_RESULT_ITEMS },
          })
        }
        throw error
      })

    const posts = Array.isArray(postsRes.data) ? postsRes.data : []
    if (posts.length === 0) return { game: null, items: [] }

    const items: GameSearchImageItem[] = posts
      .filter((post) => {
        if (typeof post.id !== 'number') return false
        if (!effectiveAllowNsfw && post.rating && post.rating !== 'g' && post.rating !== 's') {
          return false
        }
        const url = post.file_url || post.large_file_url || ''
        return isSupportedImageUrl(url)
      })
      .map((post) => {
        const url = post.file_url || post.large_file_url || ''
        return {
          id: `danbooru-${post.id}`,
          url,
          thumb: post.preview_file_url || post.large_file_url || url,
          width: Number(post.image_width ?? 0),
          height: Number(post.image_height ?? 0),
        }
      })

    return {
      game: { id: resolvedTag, name: resolvedTag },
      items: finalizeItems(sortByImageType(items, imageType)),
    }
  } catch (error) {
    throw formatUpstreamError(error, 'Danbooru')
  }
}

// ── Gelbooru (需要 User ID + API Key) ─────────────────────
type GelbooruTag = { name?: string; count?: number; type?: number }
type GelbooruPost = {
  id?: number
  file_url?: string
  sample_url?: string
  preview_url?: string
  width?: number
  height?: number
}

const resolveGelbooruTag = async (
  origin: string,
  candidates: string[],
  auth: { api_key: string; user_id: string },
): Promise<string | null> => {
  for (const candidate of candidates) {
    const normalized = normalizeTagCandidate(candidate)
    if (!normalized) continue
    try {
      const res = await axios.get<GelbooruTag[] | { tag?: GelbooruTag[] }>(`${origin}/index.php`, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { 'User-Agent': APP_USER_AGENT },
        params: {
          page: 'dapi',
          s: 'tag',
          q: 'index',
          json: 1,
          ...auth,
          name_pattern: `${normalized}%`,
          orderby: 'count',
          limit: 10,
        },
      })
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.tag)
          ? res.data.tag
          : []
      const tags = list.filter((tag) => tag.name && (tag.count ?? 0) > 0)
      if (tags.length === 0) continue

      const exact = tags.find((tag) => tag.name === normalized)
      if (exact?.name) return exact.name

      const copyrightTag = tags.find((tag) => tag.type === 3)
      if (copyrightTag?.name) return copyrightTag.name
      if (tags[0]?.name) return tags[0].name
    } catch {
      continue
    }
  }
  return null
}

export async function searchGelbooruImages(
  keyword: string,
  imageType: GameImageType,
  includeNsfw?: boolean,
): Promise<ImageSearchResult> {
  const { gelbooru } = await readPlatformSettings()
  const userId = gelbooru.userId.trim()
  const apiKey = gelbooru.apiKey.trim()
  if (!userId || !apiKey) {
    throw new Error('请先在「设置 → 平台」配置 Gelbooru User ID 与 API Key')
  }

  const origin = trimTrailingSlash(gelbooru.baseUrl, 'https://gelbooru.com')
  const effectiveAllowNsfw = includeNsfw ?? gelbooru.allowNsfw
  const auth = { api_key: apiKey, user_id: userId }

  const candidates = await resolveSearchCandidates(keyword)
  const resolvedTag =
    (await resolveGelbooruTag(origin, candidates, auth)) ??
    normalizeTagCandidate(candidates.find((c) => !hasCjk(c)) ?? keyword)

  if (!resolvedTag) return { game: null, items: [] }

  try {
    const tagsQuery = effectiveAllowNsfw ? resolvedTag : `${resolvedTag} rating:general`
    const res = await axios.get<GelbooruPost[] | { post?: GelbooruPost[] }>(`${origin}/index.php`, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'User-Agent': APP_USER_AGENT },
      params: {
        page: 'dapi',
        s: 'post',
        q: 'index',
        json: 1,
        ...auth,
        tags: tagsQuery,
        limit: MAX_RESULT_ITEMS,
      },
    })

    const posts = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.post)
        ? res.data.post
        : []
    if (posts.length === 0) return { game: null, items: [] }

    const items: GameSearchImageItem[] = posts
      .filter((post) => {
        if (typeof post.id !== 'number') return false
        const url = post.file_url || post.sample_url || ''
        return isSupportedImageUrl(url)
      })
      .map((post) => {
        const url = post.file_url || post.sample_url || ''
        return {
          id: `gelbooru-${post.id}`,
          url,
          thumb: post.preview_url || post.sample_url || url,
          width: Number(post.width ?? 0),
          height: Number(post.height ?? 0),
        }
      })

    return {
      game: { id: resolvedTag, name: resolvedTag },
      items: finalizeItems(sortByImageType(items, imageType)),
    }
  } catch (error) {
    throw formatUpstreamError(error, 'Gelbooru')
  }
}

// ── Wallhaven (需要 API Key) ──────────────────────────────
type WallhavenEntry = {
  id?: string
  path?: string
  dimension_x?: number
  dimension_y?: number
  thumbs?: { large?: string; original?: string; small?: string }
}

export async function searchWallhavenImages(
  keyword: string,
  imageType: GameImageType,
  includeNsfw?: boolean,
): Promise<ImageSearchResult> {
  const { wallhaven } = await readPlatformSettings()
  const apiKey = wallhaven.apiKey.trim()
  if (!apiKey) {
    throw new Error('请先在「设置 → 平台」配置 Wallhaven API Key')
  }

  const origin = trimTrailingSlash(wallhaven.baseUrl, 'https://wallhaven.cc/api/v1')
  const effectiveAllowNsfw = includeNsfw ?? wallhaven.allowNsfw

  const allCandidates = await resolveSearchCandidates(keyword)
  const queries = hasCjk(keyword)
    ? [...allCandidates.filter((item) => !hasCjk(item)), keyword]
    : allCandidates

  try {
    let entries: WallhavenEntry[] = []
    let matchedQuery = keyword

    for (const q of queries) {
      const res = await axios.get<{ data?: WallhavenEntry[] }>(`${origin}/search`, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': APP_USER_AGENT,
          'X-API-Key': apiKey,
        },
        params: {
          q,
          categories: '111',
          purity: effectiveAllowNsfw ? '111' : '100',
          sorting: 'relevance',
        },
      })
      if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
        entries = res.data.data
        matchedQuery = q
        break
      }
    }

    if (entries.length === 0) return { game: null, items: [] }

    const items: GameSearchImageItem[] = entries
      .filter((entry) => Boolean(entry.id && entry.path))
      .map((entry) => ({
        id: `wallhaven-${entry.id}`,
        url: entry.path!,
        thumb: entry.thumbs?.large || entry.thumbs?.original || entry.thumbs?.small || entry.path!,
        width: Number(entry.dimension_x ?? 0),
        height: Number(entry.dimension_y ?? 0),
      }))

    return {
      game: { id: matchedQuery, name: matchedQuery },
      items: finalizeItems(sortByImageType(items, imageType)),
    }
  } catch (error) {
    throw formatUpstreamError(error, 'Wallhaven')
  }
}
