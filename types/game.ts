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
  cover: string
  publishAt: string
  lastRunAt: string
  addedAt: string
  playTime: number
  rating: number
  status: number
}

export type GameSearchImageItem = {
  id: number
  url: string
  thumb: string
  width: number
  height: number
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
  items: GameSidebarItemProps[]
}
