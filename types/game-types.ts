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
