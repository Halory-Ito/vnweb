export type GameSearchItem = {
  id: string
  name: string
  developer: string
  date: string
}

export type GameSearchResult = {
  total: number
  items: GameSearchItem[]
}

export type SteamOwnedGameItem = {
  appid: number
  name: string
  playtimeMinutes: number
  coverUrl: string
  iconUrl: string
  logoUrl: string
  alreadyImported: boolean
}

export type ThirdPartyLibraryGameItem = {
  id: string
  name: string
  date: string
  coverUrl: string
  note: string
  alreadyImported: boolean
}
