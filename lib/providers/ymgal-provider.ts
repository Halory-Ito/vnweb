import { api } from '@/lib/request-utils'

import type {
  BulkImportResult,
  GameSearchResult,
  ProviderPlugin,
} from '@/lib/plugins/types'
import type { GameInfo } from '@/types/game-types'

// ── YMGal 响应类型 ────────────────────────────────────────
type YMGalApiResponse<T = unknown> = {
  success: boolean
  code: number
  msg?: string
  data?: T
}

type YMGalGameListItem = {
  id: number
  name: string
  chineseName?: string
  releaseDate?: string
  orgName?: string
  mainImg?: string
}

type YMGalPageData = {
  result: YMGalGameListItem[]
  total: number
  hasNext: boolean
  pageNum: number
  pageSize: number
}

type YMGalStaff = {
  sid: number
  pid?: number
  empName?: string
  jobName?: string
  empDesc?: string
}

type YMGalRelease = {
  id: number
  releaseName?: string
  relatedLink?: string
  platform?: string
  releaseDate?: string
  releaseLanguage?: string
  restrictionLevel?: string
}

type YMGalWebsite = {
  title?: string
  link?: string
}

type YMGalExtensionName = {
  name?: string
  type?: string
  desc?: string
}

type YMGalGame = {
  gid: number
  name: string
  chineseName?: string
  introduction?: string
  mainImg?: string
  releaseDate?: string
  typeDesc?: string
  restricted?: boolean
  haveChinese?: boolean
  developerId?: number
  website?: YMGalWebsite[]
  staff?: YMGalStaff[]
  releases?: YMGalRelease[]
  extensionName?: YMGalExtensionName[]
}

type YMGalSearchAccurateData = {
  game: YMGalGame
}

// ── 数据映射 ──────────────────────────────────────────────
const mapYMGalGameToGameInfo = (game: YMGalGame): GameInfo => {
  const staffList = game.staff ?? []

  const developers = staffList
    .filter((s) => s.jobName?.includes('开发') || s.jobName?.includes('制作'))
    .map((s) => s.empName ?? '')
    .filter(Boolean)

  // 从原画/脚本等提取关键人员
  const originalPainter = staffList
    .filter((s) => s.jobName?.includes('原画'))
    .map((s) => s.empName ?? '')
    .filter(Boolean)
    .join(', ')

  const script = staffList
    .filter((s) => s.jobName?.includes('剧本') || s.jobName?.includes('脚本'))
    .map((s) => s.empName ?? '')
    .filter(Boolean)
    .join(', ')

  const music = staffList
    .filter((s) => s.jobName?.includes('音乐'))
    .map((s) => s.empName ?? '')
    .filter(Boolean)
    .join(', ')

  const websites: Record<string, string>[] = (game.website ?? [])
    .filter((w) => w.title && w.link)
    .map((w) => ({ [w.title!]: w.link! }))

  const platforms = Array.from(
    new Set((game.releases ?? []).map((r) => r.platform ?? '').filter(Boolean)),
  )

  const aliases = (game.extensionName ?? [])
    .map((e) => e.name ?? '')
    .filter(Boolean)

  return {
    date: game.releaseDate ?? '',
    cover: game.mainImg ?? '',
    summary: game.introduction ?? '',
    name: game.name ?? '',
    nameCn: game.chineseName ?? '',
    tags: game.typeDesc ? [game.typeDesc] : [],
    nsfw: game.restricted ?? false,
    ailases: Array.from(new Set(aliases)),
    platforms,
    gameType: game.typeDesc ?? '',
    gameEngine: '',
    websites,
    links: [],
    music,
    script,
    graphic: '',
    originalPainter,
    animationProduction: '',
    developer: developers.join(', '),
    publisher: '',
    programmer: '',
  }
}

// ── YMGal 用户收藏相关类型 ─────────────────────────────────
type YMGalUserGameItem = {
  gid: number
  name: string
  chineseName?: string
  mainImg?: string
  releaseDate?: string
  userJoinTime?: string
  userRating?: number
}

type YMGalUserGameData = {
  result: YMGalUserGameItem[]
  total: number
  hasNext: boolean
  pageNum: number
  pageSize: number
}

// ── 插件定义 ──────────────────────────────────────────────
export const ymgalProvider: ProviderPlugin = {
  id: 'ymgal',
  name: 'YMGal',
  description: '月幕 Galgame，中文 Galgame 数据库',
  icon: 'Moon',
  version: '1.0.0',
  type: 'provider',
  capabilities: ['manual-search', 'bulk-import', 'account-bind'],
  accountProviderId: 'ymgal',
  defaultEnabled: true,

  searchByName: async (
    keyword: string,
    offset: number,
    limit: number,
  ): Promise<GameSearchResult> => {
    const trimmed = keyword.trim()

    // 如果输入是 ga35200 或纯数字 ID 格式，走精确查询并包装为列表结果
    const gidMatch = trimmed.match(/^(?:[Gg][Aa])?(\d+)$/)
    if (gidMatch) {
      if (offset > 0) {
        return { total: 0, items: [] }
      }
      const res = await api.request({
        method: 'GET',
        url: '/db/ymgal',
        params: { gid: gidMatch[1] },
      })
      const payload = res.data as YMGalApiResponse<YMGalSearchAccurateData>
      const game = payload.data?.game
      if (!game) {
        return { total: 0, items: [] }
      }
      return {
        total: 1,
        items: [
          {
            id: String(game.gid),
            name: game.chineseName || game.name || '',
            developer: '',
            date: game.releaseDate ?? '',
          },
        ],
      }
    }

    const pageNum = Math.floor(offset / limit) + 1

    const res = await api.request({
      method: 'POST',
      url: `/db/ymgal?keyword=${encodeURIComponent(trimmed)}&pageNum=${pageNum}&pageSize=${limit}`,
    })

    const payload = res.data as YMGalApiResponse<YMGalPageData>
    const page = payload.data

    if (!page) {
      return { total: 0, items: [] }
    }

    const items = (page.result ?? []).map((item) => ({
      id: String(item.id),
      name: item.chineseName || item.name || '',
      developer: item.orgName ?? '',
      date: item.releaseDate ?? '',
    }))

    return {
      total: page.total ?? items.length,
      items,
    }
  },

  getById: async (id: string): Promise<GameInfo | null> => {
    // 支持 "ga35200" 和 "35200" 两种格式
    const gid = id.replace(/^[Gg][Aa]/, '').trim()
    const res = await api.request({
      method: 'GET',
      url: '/db/ymgal',
      params: { gid },
    })

    const payload = res.data as YMGalApiResponse<YMGalSearchAccurateData>
    const game = payload.data?.game

    if (!game) {
      return null
    }

    return mapYMGalGameToGameInfo(game)
  },

  searchCollection: async (): Promise<BulkImportResult> => {
    const res = await api.request({
      method: 'GET',
      url: '/game/ymgal-import/search',
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
