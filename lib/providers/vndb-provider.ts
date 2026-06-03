import { api } from '@/lib/request-utils'

import type {
  BulkImportResult,
  GameSearchResult,
  ProviderPlugin,
} from '@/lib/plugins/types'
import type { GameInfo } from '@/types/game-types'

// ── VNDB 响应类型 ─────────────────────────────────────────
type VndbSearchResultItem = {
  id?: string
  title?: string
  alttitle?: string | null
  released?: string | null
  developers?: Array<{ name?: string }>
}

type VndbSearchResponse = {
  results?: VndbSearchResultItem[]
  count?: number
}

type VndbDetailResponse = {
  id?: string
  title?: string
  alttitle?: string | null
  aliases?: string[]
  released?: string | null
  image?: { url?: string } | null
  description?: string | null
  tags?: Array<{ name?: string }>
  developers?: Array<{ name?: string }>
  platforms?: string[]
  extlinks?: Array<{ label?: string; url?: string }>
}

// ── 数据映射 ──────────────────────────────────────────────
const mapVndbDetailToGameInfo = (entry: VndbDetailResponse): GameInfo => {
  const title = entry.title ?? ''
  const altTitle = entry.alttitle ?? ''
  const developers = (entry.developers ?? [])
    .map((item) => item.name ?? '')
    .filter(Boolean)
  const extlinks = (entry.extlinks ?? [])
    .map((item) => {
      const label = item.label?.trim() || ''
      const url = item.url?.trim() || ''
      if (!label || !url) return null
      return { [label]: url }
    })
    .filter((item): item is Record<string, string> => item !== null)

  return {
    date: entry.released ?? '',
    cover: entry.image?.url ?? '',
    summary: entry.description ?? '',
    name: title,
    nameCn: altTitle || title,
    tags: (entry.tags ?? []).map((tag) => tag.name ?? '').filter(Boolean),
    nsfw: false,
    ailases: Array.from(new Set((entry.aliases ?? []).filter(Boolean))),
    platforms: (entry.platforms ?? []).filter(Boolean),
    gameType: 'VNDB',
    gameEngine: '',
    websites: extlinks,
    links: [],
    music: '',
    script: '',
    graphic: '',
    originalPainter: '',
    animationProduction: '',
    developer: developers.join(', '),
    publisher: developers.join(', '),
    programmer: '',
  }
}

// ── 插件定义 ──────────────────────────────────────────────
export const vndbProvider: ProviderPlugin = {
  id: 'vndb',
  name: 'VNDB',
  description: 'Visual Novel Database，视觉小说数据库',
  icon: 'BookOpen',
  version: '1.0.0',
  type: 'provider',
  capabilities: ['manual-search', 'bulk-import', 'account-bind'],
  defaultEnabled: true,
  accountProviderId: 'vndb',

  searchByName: async (
    keyword: string,
    offset: number,
    limit: number,
  ): Promise<GameSearchResult> => {
    const res = await api.request({
      method: 'POST',
      url: `/db/vndb?offset=${offset}&limit=${limit}`,
      data: { keyword },
    })

    const payload = res.data as VndbSearchResponse
    const items = (payload.results ?? [])
      .map((item) => ({
        id: item.id ?? '',
        name: item.alttitle || item.title || '',
        developer: (item.developers ?? [])
          .map((d) => d.name ?? '')
          .filter(Boolean)
          .join(', '),
        date: item.released ?? '',
      }))
      .filter((item) => item.id && item.name)

    return {
      total: payload.count ?? items.length,
      items,
    }
  },

  getById: async (id: string): Promise<GameInfo | null> => {
    const res = await api.request({
      method: 'GET',
      url: '/db/vndb',
      params: { id },
    })
    return mapVndbDetailToGameInfo(res.data as VndbDetailResponse)
  },

  searchCollection: async (): Promise<BulkImportResult> => {
    const res = await api.request({
      method: 'GET',
      url: '/game/vndb-import/search',
      timeout: 10 * 60 * 1000,
    })

    const payload = res.data as {
      data: { total: number; items: BulkImportResult['items'] }
    }

    return {
      total: payload.data.total,
      items: payload.data.items,
    }
  },
}
