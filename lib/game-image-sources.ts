export type GameImageSource =
  | 'vndb'
  | 'steam'
  | 'bangumi'
  | 'yandere'
  | 'konachan'
  | 'safebooru'
  | 'steamgriddb'
  | 'igdb'
  | 'rawg'
  | 'thegamesdb'
  | 'giantbomb'
  | 'danbooru'
  | 'gelbooru'
  | 'wallhaven'

export type GameImageType = 'cover' | 'bg' | 'icon' | 'logo'

export const GAME_IMAGE_TYPE_LABELS: Record<GameImageType, string> = {
  cover: '封面',
  bg: '背景',
  icon: '图标',
  logo: '徽标',
}

export type GameImageSourceOption = {
  id: GameImageSource
  label: string
  supportedTypes: readonly GameImageType[]
  requiresApiKey: boolean
  supportsNsfwFilter: boolean
  placeholder: string
}

export const GAME_IMAGE_SOURCES: readonly GameImageSourceOption[] = [
  {
    id: 'vndb',
    label: 'VNDB',
    supportedTypes: ['cover', 'bg'],
    requiresApiKey: false,
    supportsNsfwFilter: true,
    placeholder: '游戏名称或 VNDB ID（如 v17）',
  },
  {
    id: 'steam',
    label: 'Steam',
    supportedTypes: ['cover', 'bg', 'logo'],
    requiresApiKey: false,
    supportsNsfwFilter: false,
    placeholder: '游戏名称或 Steam AppID',
  },
  {
    id: 'bangumi',
    label: 'Bangumi',
    supportedTypes: ['cover'],
    requiresApiKey: false,
    supportsNsfwFilter: false,
    placeholder: '游戏名称或条目 ID',
  },
  {
    id: 'yandere',
    label: 'Yande.re',
    supportedTypes: ['cover', 'bg'],
    requiresApiKey: false,
    supportsNsfwFilter: true,
    placeholder: '英文/罗马音或中文游戏名',
  },
  {
    id: 'konachan',
    label: 'Konachan',
    supportedTypes: ['cover', 'bg'],
    requiresApiKey: false,
    supportsNsfwFilter: true,
    placeholder: '英文/罗马音或中文游戏名',
  },
  {
    id: 'safebooru',
    label: 'Safebooru',
    supportedTypes: ['cover', 'bg'],
    requiresApiKey: false,
    supportsNsfwFilter: false,
    placeholder: '英文/罗马音或中文游戏名',
  },
  {
    id: 'steamgriddb',
    label: 'SteamGridDB',
    supportedTypes: ['cover', 'bg', 'icon', 'logo'],
    requiresApiKey: true,
    supportsNsfwFilter: false,
    placeholder: '游戏名称或 SteamGridDB ID',
  },
  {
    id: 'igdb',
    label: 'IGDB',
    supportedTypes: ['cover', 'bg'],
    requiresApiKey: true,
    supportsNsfwFilter: false,
    placeholder: '游戏名称或 IGDB ID',
  },
  {
    id: 'rawg',
    label: 'RAWG',
    supportedTypes: ['bg'],
    requiresApiKey: true,
    supportsNsfwFilter: false,
    placeholder: '游戏名称或 RAWG ID / Slug',
  },
  {
    id: 'thegamesdb',
    label: 'TheGamesDB',
    supportedTypes: ['cover', 'bg', 'logo'],
    requiresApiKey: true,
    supportsNsfwFilter: false,
    placeholder: '游戏名称或 TheGamesDB ID',
  },
  {
    id: 'giantbomb',
    label: 'Giant Bomb',
    supportedTypes: ['cover', 'bg'],
    requiresApiKey: true,
    supportsNsfwFilter: false,
    placeholder: '游戏名称或 Giant Bomb GUID',
  },
  {
    id: 'danbooru',
    label: 'Danbooru',
    supportedTypes: ['cover', 'bg'],
    requiresApiKey: true,
    supportsNsfwFilter: true,
    placeholder: '英文/罗马音或中文游戏名',
  },
  {
    id: 'gelbooru',
    label: 'Gelbooru',
    supportedTypes: ['cover', 'bg'],
    requiresApiKey: true,
    supportsNsfwFilter: true,
    placeholder: '英文/罗马音或中文游戏名',
  },
  {
    id: 'wallhaven',
    label: 'Wallhaven',
    supportedTypes: ['bg'],
    requiresApiKey: true,
    supportsNsfwFilter: true,
    placeholder: '英文关键词或中文游戏名',
  },
]

export const DEFAULT_GAME_IMAGE_SOURCE: GameImageSource = 'vndb'

const GAME_IMAGE_SOURCE_IDS = new Set<string>(GAME_IMAGE_SOURCES.map((item) => item.id))

export function isGameImageSource(value: string): value is GameImageSource {
  return GAME_IMAGE_SOURCE_IDS.has(value)
}

export function getGameImageSourceOption(source: GameImageSource): GameImageSourceOption {
  return GAME_IMAGE_SOURCES.find((item) => item.id === source) ?? GAME_IMAGE_SOURCES[0]
}

export function supportsGameImageType(source: GameImageSource, imageType: GameImageType): boolean {
  return getGameImageSourceOption(source).supportedTypes.includes(imageType)
}

export function getGameImageSourcesForType(imageType: GameImageType): GameImageSourceOption[] {
  return GAME_IMAGE_SOURCES.filter((item) => item.supportedTypes.includes(imageType))
}
