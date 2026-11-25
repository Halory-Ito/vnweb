import axios from 'axios'

import {
  finalizeItems,
  probeImageExists,
  REQUEST_TIMEOUT_MS,
  USER_AGENT,
  type ImageSearchResult,
} from './shared'
import { type GameImageType } from '@/lib/game-image-sources'
import { BGMClient, SGDBClient, VNDBClient } from '@/lib/vndb-client'

import type { GameSearchImageItem } from '@/types/game'

// ── SteamGridDB ───────────────────────────────────────────
export async function searchSteamGridDBImages(
  keyword: string,
  imageType: GameImageType,
): Promise<ImageSearchResult> {
  let game: { id: number; name: string } | null = null
  if (/^\d+$/.test(keyword)) {
    game = { id: Number(keyword), name: `#${keyword}` }
  } else {
    const matches = await SGDBClient.searchGame(keyword)
    if (matches?.[0]) {
      game = { id: matches[0].id, name: matches[0].name }
    }
  }

  if (!game) return { game: null, items: [] }

  const raw =
    imageType === 'cover'
      ? await SGDBClient.getGridsById(game.id)
      : imageType === 'bg'
        ? await SGDBClient.getHeroesById(game.id)
        : imageType === 'icon'
          ? await SGDBClient.getIconsById(game.id)
          : await SGDBClient.getLogosById(game.id)

  const items: GameSearchImageItem[] = []
  for (const entry of raw ?? []) {
    if (!entry || typeof entry !== 'object') continue
    const item = entry as {
      id?: number
      url?: URL | string
      thumb?: URL | string
      width?: number
      height?: number
    }
    if (typeof item.id !== 'number') continue
    items.push({
      id: item.id,
      url: String(item.url ?? ''),
      thumb: String(item.thumb ?? ''),
      width: Number(item.width ?? 0),
      height: Number(item.height ?? 0),
    })
  }

  return { game, items: finalizeItems(items) }
}

// ── VNDB (无需 Key) ───────────────────────────────────────
type VndbImageObj = {
  id?: string
  url?: string
  thumbnail?: string
  dims?: [number, number]
  sexual?: number
}

type VndbEntry = {
  id?: string
  title?: string
  alttitle?: string | null
  image?: VndbImageObj | null
  screenshots?: VndbImageObj[]
}

const normalizeVndbId = (keyword: string): string | null => {
  if (/^v\d+$/i.test(keyword)) return `v${keyword.slice(1)}`
  if (/^\d+$/.test(keyword)) return `v${keyword}`
  return null
}

const mapVndbImage = (
  img: VndbImageObj | null | undefined,
  id: string,
  label: string,
  includeNsfw: boolean,
): GameSearchImageItem | null => {
  if (!img?.url) return null
  if (!includeNsfw && typeof img.sexual === 'number' && img.sexual >= 1) return null
  return {
    id,
    url: img.url,
    thumb: img.thumbnail || img.url,
    width: Number(img.dims?.[0] ?? 0),
    height: Number(img.dims?.[1] ?? 0),
    label,
  }
}

export async function searchVndbImages(
  keyword: string,
  imageType: GameImageType,
  includeNsfw: boolean,
): Promise<ImageSearchResult> {
  const vnId = normalizeVndbId(keyword)
  const res = await VNDBClient.post<{ results?: VndbEntry[] }>('/vn', {
    filters: vnId ? ['id', '=', vnId] : ['search', '=', keyword],
    fields:
      'id, title, alttitle, image{id, url, dims, thumbnail, sexual}, screenshots{id, url, dims, thumbnail, sexual}',
    sort: vnId ? undefined : 'searchrank',
    results: vnId ? 1 : 5,
  })

  const entries = res.data.results ?? []
  if (entries.length === 0) return { game: null, items: [] }

  const primary = entries[0]
  const game = {
    id: primary.id || keyword,
    name: primary.alttitle || primary.title || keyword,
  }

  const items: GameSearchImageItem[] = []
  const multi = entries.length > 1

  for (const entry of entries) {
    const title = entry.alttitle || entry.title || entry.id || ''
    const prefix = multi && title ? `${title} · ` : ''
    const coverItem = mapVndbImage(entry.image, `${entry.id}-cover`, `${prefix}封面`, includeNsfw)
    const ssItems = (entry.screenshots ?? [])
      .map((ss, idx) =>
        mapVndbImage(ss, `${entry.id}-ss-${ss.id || idx}`, `${prefix}CG / 截图`, includeNsfw),
      )
      .filter((item): item is GameSearchImageItem => item !== null)

    if (imageType === 'cover') {
      if (coverItem) items.push(coverItem)
    } else if (imageType === 'bg') {
      items.push(...ssItems)
    }
  }

  return { game, items: finalizeItems(items) }
}

// ── Steam (无需 Key) ──────────────────────────────────────
type SteamAppDetails = {
  name?: string
  header_image?: string
  capsule_image?: string
  background_raw?: string
  background?: string
  screenshots?: Array<{ id?: number; path_thumbnail?: string; path_full?: string }>
}

export async function searchSteamImages(
  keyword: string,
  imageType: GameImageType,
): Promise<ImageSearchResult> {
  let appId: number | null = /^\d+$/.test(keyword) ? Number(keyword) : null
  let gameName = appId ? `#${appId}` : ''

  if (!appId) {
    const searchRes = await axios.get<{ items?: Array<{ id?: number; name?: string }> }>(
      'https://store.steampowered.com/api/storesearch/',
      {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { 'User-Agent': USER_AGENT },
        params: { term: keyword, cc: 'US' },
      },
    )
    const first = searchRes.data.items?.find(
      (item) => Number.isInteger(item.id) && (item.id ?? 0) > 0,
    )
    if (!first?.id) return { game: null, items: [] }
    appId = first.id
    gameName = (first.name || '').trim() || `Steam App ${appId}`
  }

  const cdnBase = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}`
  const cdnCandidates = [
    {
      key: 'cover2x',
      url: `${cdnBase}/library_600x900_2x.jpg`,
      w: 600,
      h: 900,
      label: '竖版封面 2x',
    },
    { key: 'cover', url: `${cdnBase}/library_600x900.jpg`, w: 300, h: 450, label: '竖版封面' },
    { key: 'hero2x', url: `${cdnBase}/library_hero_2x.jpg`, w: 0, h: 0, label: 'Hero 背景 2x' },
    { key: 'hero', url: `${cdnBase}/library_hero.jpg`, w: 0, h: 0, label: 'Hero 背景' },
    { key: 'logo2x', url: `${cdnBase}/logo_2x.png`, w: 0, h: 0, label: '透明徽标 2x' },
    { key: 'logo', url: `${cdnBase}/logo.png`, w: 0, h: 0, label: '透明徽标' },
    { key: 'pageBgRaw', url: `${cdnBase}/page_bg_raw.jpg`, w: 0, h: 0, label: '商店原图背景' },
  ] as const

  const [detailRes, ...cdnExists] = await Promise.all([
    axios
      .get<Record<string, { success?: boolean; data?: SteamAppDetails }>>(
        'https://store.steampowered.com/api/appdetails',
        {
          timeout: REQUEST_TIMEOUT_MS,
          headers: { 'User-Agent': USER_AGENT },
          params: { appids: appId, cc: 'US' },
        },
      )
      .catch(() => null),
    ...cdnCandidates.map((item) => probeImageExists(item.url)),
  ])

  const detail = detailRes?.data?.[String(appId)]?.data
  if (detail?.name) gameName = detail.name.trim()

  const cdnMap = new Map<string, GameSearchImageItem>()
  cdnCandidates.forEach((candidate, index) => {
    if (!cdnExists[index]) return
    cdnMap.set(candidate.key, {
      id: `steam-${appId}-${candidate.key}`,
      url: candidate.url,
      thumb: candidate.url,
      width: candidate.w,
      height: candidate.h,
      label: candidate.label,
    })
  })

  const screenshots: GameSearchImageItem[] = (detail?.screenshots ?? [])
    .filter((ss) => Boolean(ss.path_full))
    .map((ss, idx) => ({
      id: `steam-${appId}-ss-${ss.id ?? idx}`,
      url: ss.path_full!,
      thumb: ss.path_thumbnail || ss.path_full!,
      width: 0,
      height: 0,
      label: 'CG / 截图',
    }))

  const headerItem = detail?.header_image
    ? {
        id: `steam-${appId}-header`,
        url: detail.header_image,
        thumb: detail.header_image,
        width: 0,
        height: 0,
        label: '商店横幅',
      }
    : null

  const bgRawItem = detail?.background_raw
    ? {
        id: `steam-${appId}-bg-raw`,
        url: detail.background_raw,
        thumb: detail.background_raw,
        width: 0,
        height: 0,
        label: '商店背景',
      }
    : null

  const bgItem = detail?.background
    ? {
        id: `steam-${appId}-bg`,
        url: detail.background,
        thumb: detail.background,
        width: 0,
        height: 0,
        label: '背景图',
      }
    : null

  const pick = (...entries: Array<GameSearchImageItem | null | undefined>) =>
    entries.filter((item): item is GameSearchImageItem => Boolean(item))

  let ordered: GameSearchImageItem[] = []
  if (imageType === 'cover') {
    ordered = pick(cdnMap.get('cover2x'), cdnMap.get('cover'), headerItem)
  } else if (imageType === 'bg') {
    ordered = [
      ...pick(cdnMap.get('hero2x'), cdnMap.get('hero'), bgRawItem, cdnMap.get('pageBgRaw'), bgItem),
      ...screenshots,
    ]
  } else if (imageType === 'logo') {
    ordered = pick(cdnMap.get('logo2x'), cdnMap.get('logo'))
  }

  return { game: { id: appId, name: gameName }, items: finalizeItems(ordered) }
}

// ── Bangumi (无需 Key) ────────────────────────────────────
type BangumiSubject = {
  id?: number
  name?: string
  name_cn?: string
  images?: { large?: string; common?: string; medium?: string }
}

export async function searchBangumiImages(keyword: string): Promise<ImageSearchResult> {
  const subjects: BangumiSubject[] = []

  if (/^\d+$/.test(keyword)) {
    const res = await BGMClient.request<BangumiSubject>({
      method: 'GET',
      url: `/v0/subjects/${keyword}`,
      timeout: REQUEST_TIMEOUT_MS,
    })
    if (res.data?.id) subjects.push(res.data)
  } else {
    const res = await BGMClient.request<{ data?: BangumiSubject[] }>({
      method: 'POST',
      url: '/v0/search/subjects',
      data: { keyword, filter: { type: [4] } },
      params: { offset: 0, limit: 15 },
      timeout: REQUEST_TIMEOUT_MS,
    })
    subjects.push(...(res.data.data ?? []))
  }

  if (subjects.length === 0) return { game: null, items: [] }

  const first = subjects[0]
  const game = {
    id: first.id ?? keyword,
    name: first.name_cn || first.name || keyword,
  }

  const items: GameSearchImageItem[] = []
  for (const subject of subjects) {
    const url = subject.images?.large || subject.images?.common || subject.images?.medium || ''
    if (!url) continue
    items.push({
      id: `bgm-${subject.id ?? url}`,
      url,
      thumb: subject.images?.common || subject.images?.medium || url,
      width: 0,
      height: 0,
      label: subject.name_cn || subject.name || '',
    })
  }

  return { game, items: finalizeItems(items) }
}
