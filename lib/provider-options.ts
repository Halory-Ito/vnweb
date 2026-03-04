export type ProviderOption = {
  value: string
  label: string
}

export const GAME_PROVIDER_OPTIONS: ProviderOption[] = [
  { value: 'vndb', label: 'VNDB' },
  { value: 'ymgal', label: 'YMGal' },
  { value: 'steam', label: 'Steam' },
  { value: 'igdb', label: 'IGDB' },
  { value: 'dlsite', label: 'DLsite' },
  { value: 'bangumi', label: 'Bangumi' },
  { value: 'steamgriddb', label: 'SteamGrid DB' },
]

export const DEFAULT_GAME_PROVIDER = 'bangumi'
