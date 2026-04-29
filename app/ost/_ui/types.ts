export interface GameOption {
  id: string
  label: string
}

export interface OstItem {
  id: number
  gameId: number
  name: string
  cover: string
  resource?: string
  createdAt?: string
  updatedAt?: string
  gameName?: string
  gameNameCn?: string
}

export interface KhinsiderAlbum {
  name: string
  url: string
  type: 'album' | 'soundtrack'
  cover: string
  year?: string
}

export interface KhinsiderAlbumDetails {
  name: string
  covers: string[]
  songs: Array<{ name: string; url: string; duration?: string }>
}

export interface SearchResultAlbum {
  name: string
  url: string
  type: 'album' | 'soundtrack'
}

export interface GameCardListItem {
  id: number
  title: string
  cover?: string
}

/**
 * 网易云音乐专辑搜索结果
 */
export interface NeteaseAlbum {
  id: number
  name: string
  artist: string
  cover: string
  publishTime: string | null
  songCount: number
  url: string
}

/**
 * 网易云音乐歌曲信息
 */
export interface NeteaseSong {
  id: number
  name: string
  alias: string | null
  artist: string
  album: string
  albumId: number
  duration: string
  durationMs: number
  url: string
  isFree: boolean
}

/**
 * 网易云音乐专辑详情
 */
export interface NeteaseAlbumDetails {
  id: number
  name: string
  artist: string
  artistId: number | null
  cover: string
  publishTime: string | null
  description: string
  tags: string
  company: string
  songs: NeteaseSong[]
  songCount: number
  url: string
}

// ==================== Unified Types ====================

/** 数据源类型 */
export type MusicSource = 'khinsider' | 'netease'

/** 网易云音质选项 */
export type NeteaseQuality =
  | 'standard'
  | 'higher'
  | 'exhigh'
  | 'lossless'
  | 'hires'
  | 'jyeffect'
  | 'sky'
  | 'dolby'
  | 'jymaster'

/** 音质显示名称 */
export const NETEASE_QUALITY_LABELS: Record<NeteaseQuality, string> = {
  standard: '标准 (128k)',
  higher: '较高 (192k)',
  exhigh: '极高 (320k)',
  lossless: '无损 (FLAC)',
  hires: 'Hi-Res',
  jyeffect: '高清环绕声',
  sky: '沉浸环绕声',
  dolby: '杜比全景声',
  jymaster: '超清母带',
}

/**
 * 统一的专辑搜索结果
 */
export interface UnifiedSearchResult {
  source: MusicSource
  id: string | number
  name: string
  /** Khinsider 独有字段 */
  type?: 'album' | 'soundtrack'
  /** Khinsider 独有字段 */
  year?: string
  /** Netease 独有字段 */
  artist?: string
  /** Netease 独有字段 */
  songCount?: number
  cover: string
  url: string
}

/**
 * 统一的歌曲信息
 */
export interface UnifiedSong {
  name: string
  /** Khinsider: url, Netease: url */
  url: string
  /** Khinsider 独有字段 */
  duration?: string
  /** Netease 独有字段 */
  alias?: string | null
  /** Netease 独有字段 */
  artist?: string
  /** Netease 独有字段 */
  isFree?: boolean
  /** Netease 独有字段 - 歌曲 ID */
  neteaseId?: number
}

/**
 * 统一的专辑详情
 */
export interface UnifiedAlbumDetails {
  source: MusicSource
  name: string
  cover: string
  songs: UnifiedSong[]
}
