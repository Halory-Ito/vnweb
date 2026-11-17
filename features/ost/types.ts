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

// ==================== Unified Types ====================

/** 数据源类型 */
export type MusicSource = 'khinsider' | 'netease' | 'meting-api'

/**
 * 统一的专辑搜索结果
 */
export interface UnifiedSearchResult {
  source: MusicSource
  id: string | number
  name: string
  /** Khinsider 独有字段 */
  type?: 'album' | 'soundtrack' | 'song'
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
  /** 歌词链接或文件路径 */
  lyricsPath?: string
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
