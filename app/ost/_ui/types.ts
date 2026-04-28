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
