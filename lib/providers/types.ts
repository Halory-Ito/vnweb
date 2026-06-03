import type { GameInfo } from '@/types/game-types'

// ── 能力标记 ──────────────────────────────────────────────
export type ProviderCapability = 'manual-search' | 'bulk-import' | 'account-bind'

// ── 搜索相关类型 ──────────────────────────────────────────
export type GameSearchItem = {
  id: string
  name: string
  developer: string
  date: string
}

export type GameSearchResult = {
  total: number
  items: GameSearchItem[]
}

export type ThirdPartyLibraryGameItem = {
  id: string
  name: string
  date: string
  coverUrl: string
  note: string
  alreadyImported: boolean
}

export type BulkImportResult = {
  total: number
  items: ThirdPartyLibraryGameItem[]
}

// ── Steam 专用批量导入类型 ─────────────────────────────────
export type SteamOwnedGameItem = {
  appid: number
  name: string
  playtimeMinutes: number
  coverUrl: string
  iconUrl: string
  logoUrl: string
  alreadyImported: boolean
}

// ── 提供商插件接口 ────────────────────────────────────────
export interface GameProviderPlugin {
  /** 唯一标识，如 'vndb'、'steam' */
  id: string
  /** 显示名称 */
  name: string
  /** 简短描述 */
  description: string
  /** lucide-react 图标名 */
  icon: string
  /** 版本号 */
  version: string
  /** 该提供商支持的能力 */
  capabilities: ProviderCapability[]
  /** 默认是否启用 */
  defaultEnabled: boolean

  // ── 手动搜索 ──────────────────────────────────────────
  /** 按名称搜索游戏列表 */
  searchByName?(
    keyword: string,
    offset: number,
    limit: number,
  ): Promise<GameSearchResult>
  /** 按 ID 获取游戏详情 */
  getById?(id: string): Promise<GameInfo | null>

  // ── 批量导入 ──────────────────────────────────────────
  /** 搜索用户收藏/游戏库 */
  searchCollection?(): Promise<BulkImportResult>

  // ── Steam 特殊批量导入（按 UID，非账号绑定） ──────────
  searchByUid?(uid: string): Promise<{ total: number; items: SteamOwnedGameItem[] }>
  importOneByUid?(payload: {
    uid: string
    appid: number
    name: string
    playtimeMinutes: number
    coverUrl: string
    iconUrl: string
    logoUrl: string
  }): Promise<{ status: 'imported' | 'skipped'; reason?: string }>

  // ── 账号绑定 ──────────────────────────────────────────
  /** 对应 third_party_account 表中的 provider 值 */
  accountProviderId?: string
}
