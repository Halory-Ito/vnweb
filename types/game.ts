import type { GameMetadataField } from '@/lib/game-metadata-fields'

export type GameTrackingMode = 'file' | 'directory' | 'process'

export type GameDetail = {
  id: number
  date: string
  cover: string
  icon: string
  logo: string
  bg: string
  summary: string
  name: string
  nameCn: string
  tags: string[]
  nsfw: boolean
  ailases: string[]
  platforms: string[]
  gameType: string
  gameEngine: string
  music: string
  script: string
  graphic: string
  originalPainter: string
  animationProduction: string
  developer: string
  publisher: string
  programmer: string
  saveDir: string
  createdAt: string | null
  updatedAt: string | null
  exePath: string
  totalPlayTime: number
  playCount: number
  rating: number
  lastLaunchedAt: string
  playStatus: number
  isRunning: boolean
  currentSessionSeconds: number
  trackingMode: GameTrackingMode
  trackingTarget: string
  externalSourceIds: string
  websites: Array<{
    id: number
    name: string
    url: string
  }>
}

export type GameRuntime = {
  isRunning: boolean
  currentSessionSeconds: number
}

export type GameTimerRecordItem = {
  id: number
  startAt: string
  endAt: string
  durationSeconds: number
}

export type GameCardListItem = {
  id: string
  title: string
  originalTitle?: string
  searchMetadata?: Partial<Record<GameMetadataField, string>>
  tags?: string[]
  cover: string
  publishAt: string
  lastRunAt: string
  addedAt: string
  playTime: number
  rating: number
  status: number
  developer?: string
  publisher?: string
}

/** 「按名称或 vndb_id 匹配本地游戏」的结果条目 */
export type GameResolveItem = {
  id: number
  name: string
  nameCn: string
  cover: string
  title: string
}

export type GameSearchImageItem = {
  id: string | number
  url: string
  thumb: string
  width: number
  height: number
  label?: string
}

export type GameInfo = {
  date: string
  cover: string
  summary: string
  name: string
  nameCn: string
  tags: string[]
  nsfw: boolean
  ailases: string[]
  platforms: string[]
  gameType: string
  gameEngine: string
  websites: Record<string, string>[]
  links: Record<string, string>[]
  music: string
  script: string
  graphic: string
  originalPainter: string
  animationProduction: string
  developer: string
  publisher: string
  programmer: string
}

export type GameFilterState = {
  releaseDateFrom: string
  releaseDateTo: string
  playStatus: string
  developer: string
  publisher: string
  category: string
  platform: string
  tags: string
  originalPainter: string
  script: string
  music: string
  engine: string
  planning: string
}

export type GameSidebarItemProps = {
  id: string
  title: string
  icon: string
}

export type GameSidebarProps = {
  id: string
  title: string
  logoTarget?: { href: string; localOnly?: boolean }
  items: GameSidebarItemProps[]
}
export type GameStatusNames = Record<number, string>
