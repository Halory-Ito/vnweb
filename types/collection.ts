export type CollectionGameItem = {
  linkId: number
  id: number
  name: string
  cover: string
  icon: string
  date: string
  addedAt: string
  lastRunAt: string
  playTime: number
  rating: number
  status: number
}

export type CollectionItem = {
  id: number
  name: string
  createdAt: string | null
  updatedAt: string | null
  firstGameCover: string
  games: CollectionGameItem[]
}
