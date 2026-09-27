export type GameMediaLinkItem = {
  id: number
  name: string
  url: string
  createdAt: string | null
  updatedAt: string | null
}

export type GameMemoryItem = {
  id: number
  gameId: number
  title: string
  description: string
  imageUrl: string
  createdAt: string | null
  updatedAt: string | null
}
