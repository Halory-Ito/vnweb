import type { GameInfo } from '@/types/game-types'

// ═══════════════════════════════════════════════════════════
//  基础插件清单
// ═══════════════════════════════════════════════════════════

export type PluginType = 'provider' | 'feature' | 'character-provider'

export interface PluginManifest {
  id: string
  name: string
  description: string
  version: string
  icon: string
  authors?: string[]
  type: PluginType
  defaultEnabled: boolean
}

// ═══════════════════════════════════════════════════════════
//  Hook 类型系统
// ═══════════════════════════════════════════════════════════

export type HookId =
  | 'pv:resolve-url'
  | 'pv:parse-url'
  | 'pv:video-resolve'
  | 'game:enrich-metadata'

export type HookHandler<TInput = unknown, TOutput = unknown> = (
  ctx: TInput,
) => TOutput | null | Promise<TOutput | null>

// ── Hook 输入输出类型映射 ──────────────────────────────────

export interface PvResolveUrlInput {
  url: string
}

export interface PvResolveUrlOutput {
  resolvedUrl?: string
  embedUrl?: string
  coverUrl?: string
  title?: string
}

export interface PvParseUrlInput {
  url: string
}

export interface PvParseUrlOutput {
  name?: string
  thumbnail?: string
}

export interface PvVideoResolveInput {
  url: string
}

export interface PvVideoResolveOutput {
  /** iframe 嵌入地址（如 YouTube/Bilibili embed） */
  embedUrl?: string
  /** 解析后的直链地址（如 b23.tv → bilibili.com） */
  resolvedUrl?: string
}

export interface GameEnrichMetadataInput {
  gameInfo: GameInfo
  provider?: string
  externalId?: string
}

export interface GameEnrichMetadataOutput {
  patches: Partial<GameInfo>
}

// ── Hook 类型映射 ──────────────────────────────────────────

export interface HookTypeMap {
  'pv:resolve-url': { input: PvResolveUrlInput; output: PvResolveUrlOutput }
  'pv:parse-url': { input: PvParseUrlInput; output: PvParseUrlOutput }
  'pv:video-resolve': { input: PvVideoResolveInput; output: PvVideoResolveOutput }
  'game:enrich-metadata': {
    input: GameEnrichMetadataInput
    output: GameEnrichMetadataOutput
  }
}

// ═══════════════════════════════════════════════════════════
//  功能增强插件
// ═══════════════════════════════════════════════════════════

export interface FeaturePlugin extends PluginManifest {
  type: 'feature'
  hooks: HookId[]
  onActivate?(): void | Promise<void>
  onDeactivate?(): void | Promise<void>
  handlers: {
    [K in HookId]?: HookHandler<
      HookTypeMap[K]['input'],
      HookTypeMap[K]['output']
    >
  }
}

// ═══════════════════════════════════════════════════════════
//  数据源插件（兼容现有 Provider 接口）
// ═══════════════════════════════════════════════════════════

export type ProviderCapability = 'manual-search' | 'bulk-import' | 'account-bind'

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

export type SteamOwnedGameItem = {
  appid: number
  name: string
  playtimeMinutes: number
  coverUrl: string
  iconUrl: string
  logoUrl: string
  alreadyImported: boolean
}

export interface ProviderPlugin extends PluginManifest {
  type: 'provider'
  capabilities: ProviderCapability[]
  accountProviderId?: string

  searchByName?(
    keyword: string,
    offset: number,
    limit: number,
  ): Promise<GameSearchResult>
  getById?(id: string): Promise<GameInfo | null>
  searchCollection?(): Promise<BulkImportResult>
  searchByUid?(
    uid: string,
  ): Promise<{ total: number; items: SteamOwnedGameItem[] }>
  importOneByUid?(payload: {
    uid: string
    appid: number
    name: string
    playtimeMinutes: number
    coverUrl: string
    iconUrl: string
    logoUrl: string
  }): Promise<{ status: 'imported' | 'skipped'; reason?: string }>
}

// ═══════════════════════════════════════════════════════════
//  角色数据源插件
// ═══════════════════════════════════════════════════════════

/** 归一化后的角色数据行（存入 CharacterTable 的统一形状） */
export type NormalizedCharacterRow = {
  gameId: number
  vndbId: string
  name: string
  original: string
  description: string
  imageUrl: string
  bloodType: string
  height: number | null
  weight: number | null
  bust: number | null
  waist: number | null
  hips: number | null
  age: number | null
  birthdayMonth: number | null
  birthdayDay: number | null
  sex: string
  gender: string
  createdAt: string
  updatedAt: string
}

export interface CharacterProviderPlugin extends PluginManifest {
  type: 'character-provider'
  /** 该数据源在 GameIdMapTable / externalSourceIds 中对应的 provider 名称 */
  sourceId: string
  /** 原始外部 ID 归一化（如 "v123" → "v123"、"subject/456" → "456"） */
  normalizeExternalId(rawId: string): string
  /** 根据 gameId 解析出该数据源的外部 ID（查 GameIdMapTable） */
  resolveExternalId(gameId: number): Promise<string | null>
  /** 从外部 API 拉取角色列表 */
  fetchCharacters(ctx: {
    gameId: number
    externalId: string
    saveImagesToLocal: boolean
    now: string
  }): Promise<NormalizedCharacterRow[]>
}

// ═══════════════════════════════════════════════════════════
//  统一插件类型
// ═══════════════════════════════════════════════════════════

export type AnyPlugin = FeaturePlugin | ProviderPlugin | CharacterProviderPlugin
