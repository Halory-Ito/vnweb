import axios from 'axios'

import {
  APP_USER_AGENT,
  finalizeItems,
  REQUEST_TIMEOUT_MS,
  resolveSearchCandidates,
  formatUpstreamError,
  trimTrailingSlash,
  type ImageSearchResult,
} from './shared'
import { buildGameImagePreviewUrl } from '@/lib/game-image-preview'
import { type GameImageType } from '@/lib/game-image-sources'
import { readPlatformSettings } from '@/lib/server/platform-settings'

import type { GameSearchImageItem } from '@/types/game'

// ── IGDB ──────────────────────────────────────────────────
type IgdbImageObj = {
  id?: number
  image_id?: string
  width?: number
  height?: number
}

type IgdbGameEntry = {
  id?: number
  name?: string
  cover?: IgdbImageObj
  artworks?: IgdbImageObj[]
  screenshots?: IgdbImageObj[]
}

const igdbTokenState = globalThis as typeof globalThis & {
  igdbTokenCache?: {
    cacheKey: string
    accessToken: string
    expiresAt: number
  }
}

const escapeApicalypseString = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const buildIgdbImageUrl = (imageId: string, size: string) =>
  `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`

const getIgdbAccessToken = async (
  clientId: string,
  clientSecret: string,
  forceRefresh = false,
): Promise<string> => {
  const cacheKey = `${clientId}:${clientSecret}`
  const cached = igdbTokenState.igdbTokenCache
  if (
    !forceRefresh &&
    cached &&
    cached.cacheKey === cacheKey &&
    cached.expiresAt > Date.now() + 60_000
  ) {
    return cached.accessToken
  }

  const res = await axios.post<{ access_token?: string; expires_in?: number }>(
    'https://id.twitch.tv/oauth2/token',
    null,
    {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'User-Agent': APP_USER_AGENT },
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      },
    },
  )

  const accessToken = res.data?.access_token?.trim()
  if (!accessToken) {
    throw new Error('获取 IGDB 访问令牌失败，请检查 Twitch Client ID 与 Client Secret')
  }

  const expiresIn = typeof res.data?.expires_in === 'number' ? res.data.expires_in : 3600
  igdbTokenState.igdbTokenCache = {
    cacheKey,
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  }
  return accessToken
}

const queryIgdbGames = async (
  origin: string,
  clientId: string,
  clientSecret: string,
  body: string,
): Promise<IgdbGameEntry[]> => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getIgdbAccessToken(clientId, clientSecret, attempt > 0)
    try {
      const res = await axios.post<IgdbGameEntry[]>(`${origin}/games`, body, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': APP_USER_AGENT,
          'Client-ID': clientId,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
          Accept: 'application/json',
        },
      })
      return Array.isArray(res.data) ? res.data : []
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && attempt === 0) {
        igdbTokenState.igdbTokenCache = undefined
        continue
      }
      throw formatUpstreamError(error, 'IGDB')
    }
  }
  return []
}

const mapIgdbImage = (
  img: IgdbImageObj | undefined,
  id: string,
  thumbSize: string,
  label: string,
): GameSearchImageItem | null => {
  if (!img?.image_id) return null
  return {
    id,
    url: buildIgdbImageUrl(img.image_id, 't_original'),
    thumb: buildIgdbImageUrl(img.image_id, thumbSize),
    width: Number(img.width ?? 0),
    height: Number(img.height ?? 0),
    label,
  }
}

export async function searchIgdbImages(
  keyword: string,
  imageType: GameImageType,
): Promise<ImageSearchResult> {
  const { igdb } = await readPlatformSettings()
  const clientId = igdb.clientId.trim()
  const clientSecret = igdb.clientSecret.trim()
  if (!clientId || !clientSecret) {
    throw new Error('请先在「设置 → 平台」配置 IGDB Client ID 与 Client Secret')
  }

  const origin = trimTrailingSlash(igdb.baseUrl, 'https://api.igdb.com/v4')
  const fields =
    'fields name, cover.image_id, cover.width, cover.height, artworks.image_id, artworks.width, artworks.height, screenshots.image_id, screenshots.width, screenshots.height;'

  let entries: IgdbGameEntry[] = []
  try {
    if (/^\d+$/.test(keyword)) {
      entries = await queryIgdbGames(
        origin,
        clientId,
        clientSecret,
        `${fields} where id = ${keyword}; limit 1;`,
      )
    } else {
      const candidates = await resolveSearchCandidates(keyword)
      for (const candidate of candidates) {
        entries = await queryIgdbGames(
          origin,
          clientId,
          clientSecret,
          `${fields} search "${escapeApicalypseString(candidate)}"; limit 5;`,
        )
        if (entries.length > 0) break
      }
    }
  } catch (error) {
    throw formatUpstreamError(error, 'IGDB')
  }

  if (entries.length === 0) return { game: null, items: [] }

  const primary = entries[0]
  const game = {
    id: primary.id ?? keyword,
    name: primary.name?.trim() || `#${primary.id ?? keyword}`,
  }

  const multi = entries.length > 1
  const items: GameSearchImageItem[] = []

  for (const entry of entries) {
    const gameId = entry.id ?? 'game'
    const prefix = multi && entry.name ? `${entry.name} · ` : ''
    const coverItem = mapIgdbImage(
      entry.cover,
      `igdb-${gameId}-cover`,
      't_cover_big',
      `${prefix}封面`,
    )
    const artworkItems = (entry.artworks ?? [])
      .map((art, idx) =>
        mapIgdbImage(
          art,
          `igdb-${gameId}-art-${art.id ?? idx}`,
          't_screenshot_med',
          `${prefix}官方插画`,
        ),
      )
      .filter((item): item is GameSearchImageItem => item !== null)
    const screenshotItems = (entry.screenshots ?? [])
      .map((ss, idx) =>
        mapIgdbImage(
          ss,
          `igdb-${gameId}-ss-${ss.id ?? idx}`,
          't_screenshot_med',
          `${prefix}CG / 截图`,
        ),
      )
      .filter((item): item is GameSearchImageItem => item !== null)

    if (imageType === 'cover') {
      if (coverItem) items.push(coverItem)
    } else if (imageType === 'bg') {
      items.push(...artworkItems, ...screenshotItems)
    }
  }

  return { game, items: finalizeItems(items) }
}

// ── RAWG ──────────────────────────────────────────────────
type RawgGameItem = {
  id?: number
  name?: string
  background_image?: string | null
  background_image_additional?: string | null
  short_screenshots?: Array<{ id?: number; image?: string }>
}

type RawgScreenshotItem = {
  id?: number
  image?: string
  width?: number
  height?: number
}

export async function searchRawgImages(keyword: string): Promise<ImageSearchResult> {
  const { rawg } = await readPlatformSettings()
  const apiKey = rawg.apiKey.trim()
  if (!apiKey) {
    throw new Error('请先在「设置 → 平台」配置 RAWG API Key')
  }

  const origin = trimTrailingSlash(rawg.baseUrl, 'https://api.rawg.io/api')
  const isNumericId = /^\d+$/.test(keyword)
  const isSlug = /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(keyword)

  let entries: RawgGameItem[] = []
  try {
    if (isNumericId || isSlug) {
      try {
        const res = await axios.get<RawgGameItem>(
          `${origin}/games/${encodeURIComponent(keyword.toLowerCase())}`,
          {
            timeout: REQUEST_TIMEOUT_MS,
            headers: { 'User-Agent': APP_USER_AGENT },
            params: { key: apiKey },
          },
        )
        if (res.data?.id) entries = [res.data]
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 404 || isNumericId) {
          throw error
        }
      }
    }

    if (entries.length === 0 && !isNumericId) {
      const candidates = await resolveSearchCandidates(keyword)
      for (const candidate of candidates) {
        const res = await axios.get<{ results?: RawgGameItem[] }>(`${origin}/games`, {
          timeout: REQUEST_TIMEOUT_MS,
          headers: { 'User-Agent': APP_USER_AGENT },
          params: { key: apiKey, search: candidate, page_size: 5 },
        })
        if (Array.isArray(res.data?.results) && res.data.results.length > 0) {
          entries = res.data.results
          break
        }
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404 && isNumericId) {
      return { game: null, items: [] }
    }
    throw formatUpstreamError(error, 'RAWG')
  }

  const primary = entries.find((item) => typeof item.id === 'number')
  if (!primary?.id) return { game: null, items: [] }

  const screenshotsRes = await axios
    .get<{ results?: RawgScreenshotItem[] }>(`${origin}/games/${primary.id}/screenshots`, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'User-Agent': APP_USER_AGENT },
      params: { key: apiKey, page_size: 20 },
    })
    .catch(() => null)

  const items: GameSearchImageItem[] = []
  if (primary.background_image) {
    items.push({
      id: `rawg-${primary.id}-bg`,
      url: primary.background_image,
      thumb: primary.background_image,
      width: 0,
      height: 0,
      label: '官方背景图',
    })
  }
  if (primary.background_image_additional) {
    items.push({
      id: `rawg-${primary.id}-bg-extra`,
      url: primary.background_image_additional,
      thumb: primary.background_image_additional,
      width: 0,
      height: 0,
      label: '备用背景图',
    })
  }

  for (const [idx, ss] of (screenshotsRes?.data?.results ?? []).entries()) {
    if (!ss.image) continue
    items.push({
      id: `rawg-${primary.id}-ss-${ss.id ?? idx}`,
      url: ss.image,
      thumb: ss.image,
      width: Number(ss.width ?? 0),
      height: Number(ss.height ?? 0),
      label: 'CG / 截图',
    })
  }

  for (const [idx, ss] of (primary.short_screenshots ?? []).entries()) {
    if (!ss.image) continue
    items.push({
      id: `rawg-${primary.id}-short-${ss.id ?? idx}`,
      url: ss.image,
      thumb: ss.image,
      width: 0,
      height: 0,
      label: 'CG / 截图',
    })
  }

  for (const entry of entries.slice(1)) {
    if (!entry.id || !entry.background_image) continue
    items.push({
      id: `rawg-${entry.id}-bg`,
      url: entry.background_image,
      thumb: entry.background_image,
      width: 0,
      height: 0,
      label: entry.name ? `${entry.name} · 背景图` : '背景图',
    })
  }

  return {
    game: {
      id: primary.id,
      name: primary.name?.trim() || `#${primary.id}`,
    },
    items: finalizeItems(items),
  }
}

// ── TheGamesDB ────────────────────────────────────────────
type TgdbGameEntry = {
  id?: number
  game_title?: string
  name?: string
}

type TgdbImageEntry = {
  id?: number
  type?: string
  side?: string
  filename?: string
  resolution?: string
}

const parseTgdbResolution = (value?: string): { width: number; height: number } => {
  if (!value) return { width: 0, height: 0 }
  const matched = value.trim().match(/^(\d+)x(\d+)$/i)
  if (!matched) return { width: 0, height: 0 }
  return { width: Number(matched[1]), height: Number(matched[2]) }
}

const ensureTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`)

const getTgdbPriority = (entry: TgdbImageEntry, imageType: GameImageType): number => {
  const type = (entry.type || '').toLowerCase()
  const side = (entry.side || '').toLowerCase()
  if (imageType === 'bg') {
    if (type === 'fanart') return 0
    if (type === 'screenshot') return 1
    if (type === 'titlescreen') return 2
    if (type === 'banner') return 3
    return type === 'boxart' && side === 'front' ? 4 : 5
  }
  if (imageType === 'logo') {
    if (type === 'clearlogo') return 0
    if (type === 'banner') return 1
    return 2
  }
  if (imageType === 'icon') {
    if (type === 'boxart' && side === 'front') return 0
    if (type === 'clearlogo') return 1
    if (type === 'fanart') return 2
    return 3
  }
  if (type === 'boxart' && side === 'front') return 0
  if (type === 'fanart') return 1
  if (type === 'titlescreen') return 2
  if (type === 'screenshot') return 3
  if (type === 'boxart') return 4
  return type === 'banner' ? 5 : 6
}

const getTgdbLabel = (entry: TgdbImageEntry): string => {
  const type = (entry.type || '').toLowerCase()
  const side = (entry.side || '').toLowerCase()
  if (type === 'boxart') return side === 'front' ? '封面盒绘' : '盒绘背面'
  if (type === 'fanart') return 'Fanart 壁纸'
  if (type === 'banner') return '横幅'
  if (type === 'clearlogo') return '透明徽标'
  if (type === 'screenshot') return 'CG / 截图'
  if (type === 'titlescreen') return '标题画面'
  return ''
}

export async function searchTheGamesDbImages(
  keyword: string,
  imageType: GameImageType,
): Promise<ImageSearchResult> {
  const { thegamesdb } = await readPlatformSettings()
  const apiKey = thegamesdb.apiKey.trim()
  if (!apiKey) {
    throw new Error('请先在「设置 → 平台」配置 TheGamesDB API Key')
  }

  const origin = trimTrailingSlash(thegamesdb.baseUrl, 'https://api.thegamesdb.net')
  let games: TgdbGameEntry[] = []

  try {
    if (/^\d+$/.test(keyword)) {
      const idNum = Number(keyword)
      const byIdRes = await axios
        .get<{ data?: { games?: TgdbGameEntry[] } }>(`${origin}/v1/Games/ByGameID`, {
          timeout: REQUEST_TIMEOUT_MS,
          headers: { 'User-Agent': APP_USER_AGENT },
          params: { apikey: apiKey, id: idNum },
        })
        .catch(() => null)
      games = byIdRes?.data?.data?.games ?? [{ id: idNum, game_title: `#${idNum}` }]
    } else {
      const candidates = await resolveSearchCandidates(keyword)
      for (const candidate of candidates) {
        const res = await axios.get<{ data?: { games?: TgdbGameEntry[] } }>(
          `${origin}/v1/Games/ByGameName`,
          {
            timeout: REQUEST_TIMEOUT_MS,
            headers: { 'User-Agent': APP_USER_AGENT },
            params: { apikey: apiKey, name: candidate },
          },
        )
        const matched = (res.data?.data?.games ?? []).filter((g) => typeof g.id === 'number')
        if (matched.length > 0) {
          games = matched.slice(0, 5)
          break
        }
      }
    }

    const validGames = games.filter(
      (g): g is TgdbGameEntry & { id: number } => typeof g.id === 'number',
    )
    if (validGames.length === 0) return { game: null, items: [] }

    const imagesRes = await axios.get<{
      data?: {
        base_url?: { original?: string }
        images?: Record<string, TgdbImageEntry[]>
      }
    }>(`${origin}/v1/Games/Images`, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'User-Agent': APP_USER_AGENT },
      params: { apikey: apiKey, games_id: validGames.map((g) => g.id).join(',') },
    })

    const baseUrls = imagesRes.data?.data?.base_url
    const originalBase = ensureTrailingSlash(
      baseUrls?.original || 'https://cdn.thegamesdb.net/images/original/',
    )
    const imagesMap = imagesRes.data?.data?.images ?? {}

    const primary = validGames[0]
    const primaryTitle = primary.game_title || primary.name || `#${primary.id}`
    const multi = validGames.length > 1
    const items: GameSearchImageItem[] = []

    const isTgdbImageForType = (img: TgdbImageEntry): boolean => {
      const type = (img.type || '').toLowerCase()
      if (imageType === 'cover') return type === 'boxart'
      if (imageType === 'bg') {
        return (
          type === 'fanart' || type === 'screenshot' || type === 'titlescreen' || type === 'banner'
        )
      }
      if (imageType === 'logo') return type === 'clearlogo'
      return false
    }

    for (const entry of validGames) {
      const gameImages = (imagesMap[String(entry.id)] ?? [])
        .filter(isTgdbImageForType)
        .sort((a, b) => getTgdbPriority(a, imageType) - getTgdbPriority(b, imageType))
      const title = entry.game_title || entry.name || ''
      const prefix = multi && title ? `${title} · ` : ''

      for (const img of gameImages) {
        const rel = img.filename?.trim().replace(/^\/+/, '')
        if (!rel) continue
        const { width, height } = parseTgdbResolution(img.resolution)
        const label = getTgdbLabel(img)
        const originalUrl = `${originalBase}${rel}`
        items.push({
          id: `tgdb-${entry.id}-${img.id ?? rel}`,
          url: originalUrl,
          thumb: buildGameImagePreviewUrl(originalUrl),
          width,
          height,
          label: `${prefix}${label}`.trim() || undefined,
        })
      }
    }

    return {
      game: { id: primary.id, name: primaryTitle },
      items: finalizeItems(items),
    }
  } catch (error) {
    throw formatUpstreamError(error, 'TheGamesDB')
  }
}

// ── Giant Bomb ────────────────────────────────────────────
type GiantBombImageObj = {
  icon_url?: string
  medium_url?: string
  screen_url?: string
  screen_large_url?: string
  small_url?: string
  super_url?: string
  thumb_url?: string
  tiny_url?: string
  original_url?: string
}

type GiantBombGameEntry = {
  guid?: string
  name?: string
  image?: GiantBombImageObj | null
  images?: GiantBombImageObj[]
}

type GiantBombApiEnvelope<T> = {
  status_code?: number
  error?: string
  results?: T
}

const assertGiantBombOk = <T>(data: GiantBombApiEnvelope<T> | undefined): T | undefined => {
  if (typeof data?.status_code === 'number' && data.status_code !== 1) {
    if (data.status_code === 100) {
      throw new Error('Giant Bomb API Key 无效，请检查设置')
    }
    throw new Error(
      data.error && data.error !== 'OK'
        ? `Giant Bomb 接口错误：${data.error}`
        : 'Giant Bomb 请求失败',
    )
  }
  return data?.results
}

const mapGiantBombImage = (
  img: GiantBombImageObj | null | undefined,
  id: string,
  label: string,
): GameSearchImageItem | null => {
  if (!img) return null
  const url =
    img.original_url ||
    img.super_url ||
    img.screen_large_url ||
    img.screen_url ||
    img.medium_url ||
    img.small_url ||
    ''
  if (!url) return null
  return {
    id,
    url,
    thumb: img.medium_url || img.small_url || img.thumb_url || url,
    width: 0,
    height: 0,
    label,
  }
}

export async function searchGiantBombImages(
  keyword: string,
  imageType: GameImageType,
): Promise<ImageSearchResult> {
  const { giantbomb } = await readPlatformSettings()
  const apiKey = giantbomb.apiKey.trim()
  if (!apiKey) {
    throw new Error('请先在「设置 → 平台」配置 Giant Bomb API Key')
  }

  const origin = trimTrailingSlash(giantbomb.baseUrl, 'https://www.giantbomb.com/api')
  const directGuid = /^\d+-\d+$/.test(keyword)
    ? keyword
    : /^\d+$/.test(keyword)
      ? `3030-${keyword}`
      : null

  try {
    let entries: GiantBombGameEntry[] = []

    if (directGuid) {
      const res = await axios.get<GiantBombApiEnvelope<GiantBombGameEntry>>(
        `${origin}/game/${directGuid}/`,
        {
          timeout: REQUEST_TIMEOUT_MS,
          headers: { 'User-Agent': APP_USER_AGENT },
          params: {
            api_key: apiKey,
            format: 'json',
            field_list: imageType === 'bg' ? 'guid,name,images' : 'guid,name,image',
          },
        },
      )
      const detail = assertGiantBombOk(res.data)
      if (detail?.guid) entries = [detail]
    } else {
      const candidates = await resolveSearchCandidates(keyword)
      for (const candidate of candidates) {
        const res = await axios.get<GiantBombApiEnvelope<GiantBombGameEntry[]>>(
          `${origin}/search/`,
          {
            timeout: REQUEST_TIMEOUT_MS,
            headers: { 'User-Agent': APP_USER_AGENT },
            params: {
              api_key: apiKey,
              format: 'json',
              resources: 'game',
              query: candidate,
              limit: 5,
              field_list: 'guid,name,image',
            },
          },
        )
        const list = assertGiantBombOk(res.data)
        if (Array.isArray(list) && list.length > 0) {
          entries = list
          break
        }
      }
    }

    const primary = entries.find((entry) => Boolean(entry.guid))
    if (!primary?.guid) return { game: null, items: [] }

    let gallerySource: GiantBombGameEntry = primary
    if (!directGuid && imageType === 'bg') {
      const detailRes = await axios
        .get<GiantBombApiEnvelope<GiantBombGameEntry>>(`${origin}/game/${primary.guid}/`, {
          timeout: REQUEST_TIMEOUT_MS,
          headers: { 'User-Agent': APP_USER_AGENT },
          params: { api_key: apiKey, format: 'json', field_list: 'guid,name,images' },
        })
        .catch(() => null)
      const detailData = detailRes ? assertGiantBombOk(detailRes.data) : undefined
      if (detailData?.guid) gallerySource = detailData
    }

    let items: GameSearchImageItem[] = []
    if (imageType === 'bg') {
      items = (gallerySource.images ?? [])
        .map((img, idx) => mapGiantBombImage(img, `gb-${primary.guid}-img-${idx}`, '相册 / 截图'))
        .filter((item): item is GameSearchImageItem => item !== null)
    } else if (imageType === 'cover') {
      const mainImage = mapGiantBombImage(
        gallerySource.image ?? primary.image,
        `gb-${primary.guid}-main`,
        '官方封面',
      )
      const extraHits = entries
        .slice(1)
        .map((entry) =>
          mapGiantBombImage(
            entry.image,
            `gb-${entry.guid ?? entry.name}-main`,
            entry.name ? `${entry.name} · 封面` : '封面',
          ),
        )
        .filter((item): item is GameSearchImageItem => item !== null)
      items = [...(mainImage ? [mainImage] : []), ...extraHits]
    }

    return {
      game: {
        id: primary.guid,
        name: gallerySource.name?.trim() || primary.name?.trim() || primary.guid,
      },
      items: finalizeItems(items),
    }
  } catch (error) {
    throw formatUpstreamError(error, 'Giant Bomb')
  }
}
