export type PvMetadata = {
  category: string
  style: string
  year: string
  character: string
  purpose: string
  duration: number | null
}

export type PvWritePayload = {
  gameId: number
  name: string
  url: string
  metadata?: PvMetadata
}

export type PvManageItem = {
  id: number
  gameId: number
  name: string
  url: string
  createdAt: string | null
  updatedAt: string | null
  gameName: string
  gameNameCn: string
  gameCover: string
  gameBg: string
  metadata?: PvMetadata | null
}
