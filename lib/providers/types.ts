import type { GameInfo } from '@/types/game'

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

export interface GameProvider {
  id: string
  name: string
  description: string
  version: string
  icon: string
  type: 'provider'
  defaultEnabled: boolean
  capabilities: ProviderCapability[]
  accountProviderId?: string

  searchByName?(keyword: string, offset: number, limit: number): Promise<GameSearchResult>
  getById?(id: string): Promise<GameInfo | null>
  searchCollection?(): Promise<BulkImportResult>
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
}

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

export interface CharacterProvider {
  id: string
  name: string
  description: string
  version: string
  icon: string
  type: 'character-provider'
  defaultEnabled: boolean
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

export type ProviderPlugin = GameProvider
export type GameProviderPlugin = GameProvider
export type CharacterProviderPlugin = CharacterProvider
