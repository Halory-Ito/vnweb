export type OstManageItem = {
  id: number
  gameId: number
  name: string
  cover: string
  resource: string
  createdAt: string | null
  updatedAt: string | null
  gameName: string
  gameNameCn: string
  gameCover: string
  gameBg: string
}

export type OstSongItem = {
  id: number
  gameId: number
  ostId: number
  name: string
  url: string
  mediaType: string
  lyricsText: string
  lyricsPath: string
  createdAt?: string
  updatedAt?: string
}
