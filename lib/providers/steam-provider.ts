import { api } from '@/lib/request-utils'

import type {
  GameSearchResult,
  ProviderPlugin,
  SteamOwnedGameItem,
} from '@/lib/plugins/types'
import type { GameInfo } from '@/types/game-types'

// ── 插件定义 ──────────────────────────────────────────────
export const steamProvider: ProviderPlugin = {
  id: 'steam',
  name: 'Steam',
  description: 'Steam 游戏平台，支持游戏库导入和游玩时长同步',
  icon: 'Gamepad2',
  version: '1.0.0',
  type: 'provider',
  capabilities: ['manual-search', 'bulk-import'],
  defaultEnabled: true,

  searchByName: async (
    keyword: string,
    offset: number,
    limit: number,
  ): Promise<GameSearchResult> => {
    const res = await api.request({
      method: 'POST',
      url: '/game/steam-import/name-search',
      data: { keyword, offset, limit },
    })

    return (res.data as { data: GameSearchResult }).data
  },

  getById: async (id: string): Promise<GameInfo | null> => {
    const res = await api.request({
      method: 'GET',
      url: '/game/steam-import/name-search',
      params: { id },
    })
    return (res.data as { data: GameInfo }).data
  },

  searchByUid: async (
    uid: string,
  ): Promise<{ total: number; items: SteamOwnedGameItem[] }> => {
    const res = await api.request({
      method: 'POST',
      url: '/game/steam-import/search',
      timeout: 10 * 60 * 1000,
      data: { steamId: uid },
    })

    return (res.data as { data: { total: number; items: SteamOwnedGameItem[] } }).data
  },

  importOneByUid: async (payload) => {
    const res = await api.request({
      method: 'POST',
      url: '/game/steam-import',
      timeout: 10 * 60 * 1000,
      data: {
        steamId: payload.uid,
        appid: payload.appid,
        name: payload.name,
        playtimeMinutes: payload.playtimeMinutes,
        coverUrl: payload.coverUrl,
        iconUrl: payload.iconUrl,
        logoUrl: payload.logoUrl,
      },
    })

    const data = (res.data as {
      data: { status: 'imported' | 'skipped'; reason?: string }
    }).data

    return { status: data.status, reason: data.reason }
  },
}
