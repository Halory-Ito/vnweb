import { readPlatformCache, writePlatformCache } from './platform-cache'
import { api } from '@/lib/request-utils'

import type { GameImageType } from '@/lib/game-image-sources'

export const platformVisibilityKeys = [
  'steam',
  'bangumi',
  'vndb',
  'ymgal',
  'steamgriddb',
  'igdb',
  'rawg',
  'thegamesdb',
  'giantbomb',
  'yandere',
  'konachan',
  'safebooru',
  'danbooru',
  'gelbooru',
  'wallhaven',
  'meting',
  'enhanced',
] as const
export type PlatformVisibilityKey = (typeof platformVisibilityKeys)[number]

export const platformFeatureCategories = [
  {
    id: 'library-import',
    label: '游戏库导入',
    platforms: ['steam', 'bangumi', 'vndb', 'ymgal'],
  },
  {
    id: 'game-metadata',
    label: '游戏资料',
    platforms: ['bangumi', 'vndb', 'ymgal', 'steam', 'steamgriddb'],
  },
  {
    id: 'character-metadata',
    label: '角色资料',
    platforms: ['vndb', 'bangumi', 'ymgal'],
  },
  {
    id: 'status-sync',
    label: '状态同步',
    platforms: ['bangumi', 'vndb'],
  },
  {
    id: 'game-cover',
    label: '游戏封面',
    platforms: [
      'steamgriddb',
      'vndb',
      'steam',
      'bangumi',
      'igdb',
      'thegamesdb',
      'giantbomb',
      'yandere',
      'konachan',
      'safebooru',
      'danbooru',
      'gelbooru',
    ],
  },
  {
    id: 'game-bg',
    label: '游戏背景',
    platforms: [
      'steamgriddb',
      'vndb',
      'steam',
      'igdb',
      'rawg',
      'thegamesdb',
      'giantbomb',
      'yandere',
      'konachan',
      'safebooru',
      'danbooru',
      'gelbooru',
      'wallhaven',
    ],
  },
  {
    id: 'game-icon',
    label: '游戏图标',
    platforms: ['steamgriddb'],
  },
  {
    id: 'game-logo',
    label: '游戏徽标',
    platforms: ['steamgriddb', 'steam', 'thegamesdb'],
  },
  {
    id: 'music-service',
    label: '音乐服务',
    platforms: ['meting', 'enhanced'],
  },
] as const satisfies readonly {
  id: string
  label: string
  platforms: readonly PlatformVisibilityKey[]
}[]

export type PlatformFeatureCategory = (typeof platformFeatureCategories)[number]['id']
export type PlatformFeatureToggleKey = `${PlatformFeatureCategory}:${PlatformVisibilityKey}`
export type PlatformVisibility = Partial<
  Record<PlatformVisibilityKey | PlatformFeatureToggleKey, boolean>
>

export const GAME_IMAGE_TYPE_TO_FEATURE_CATEGORY: Record<GameImageType, PlatformFeatureCategory> = {
  cover: 'game-cover',
  bg: 'game-bg',
  icon: 'game-icon',
  logo: 'game-logo',
}

const PLATFORM_VISIBILITY_KEY_SET = new Set<string>(platformVisibilityKeys)

const DEFAULT_HIDDEN_IMAGE_PLATFORMS = new Set<PlatformVisibilityKey>([
  'igdb',
  'rawg',
  'thegamesdb',
  'giantbomb',
  'danbooru',
  'gelbooru',
  'wallhaven',
])

const FEATURE_PLATFORMS_MAP: ReadonlyMap<
  PlatformFeatureCategory,
  ReadonlySet<PlatformVisibilityKey>
> = new Map(
  platformFeatureCategories.map((category) => [
    category.id,
    new Set<PlatformVisibilityKey>(category.platforms),
  ]),
)

const PLATFORM_CATEGORIES_MAP: ReadonlyMap<
  PlatformVisibilityKey,
  readonly PlatformFeatureCategory[]
> = new Map(
  platformVisibilityKeys.map((platform) => [
    platform,
    platformFeatureCategories
      .filter((category) =>
        (category.platforms as readonly PlatformVisibilityKey[]).includes(platform),
      )
      .map((category) => category.id),
  ]),
)

export function isPlatformVisibilityKey(value: string): value is PlatformVisibilityKey {
  return PLATFORM_VISIBILITY_KEY_SET.has(value)
}

export function getPlatformFeatureKey(
  category: PlatformFeatureCategory,
  platform: PlatformVisibilityKey,
): PlatformFeatureToggleKey {
  return `${category}:${platform}`
}

export function isValidPlatformFeaturePair(
  category: string,
  platform: string,
): category is PlatformFeatureCategory {
  if (!isPlatformVisibilityKey(platform)) return false
  const set = FEATURE_PLATFORMS_MAP.get(category as PlatformFeatureCategory)
  return set ? set.has(platform) : false
}

export function getCategoriesForPlatform(
  platform: PlatformVisibilityKey,
): readonly PlatformFeatureCategory[] {
  return PLATFORM_CATEGORIES_MAP.get(platform) ?? []
}

export const allPlatformFeatureToggleKeys: readonly PlatformFeatureToggleKey[] =
  platformFeatureCategories.flatMap((category) =>
    category.platforms.map((platform) => getPlatformFeatureKey(category.id, platform)),
  )

export function isDefaultVisiblePlatform(
  key: PlatformVisibilityKey,
  hasBoundAccount: (provider: 'steam' | 'bangumi' | 'vndb' | 'ymgal') => boolean,
): boolean {
  if (key === 'steam' || key === 'bangumi' || key === 'vndb' || key === 'ymgal') {
    return hasBoundAccount(key)
  }
  if (DEFAULT_HIDDEN_IMAGE_PLATFORMS.has(key)) {
    return false
  }
  return true
}

export function isPlatformFeatureEnabled(
  category: PlatformFeatureCategory,
  platform: PlatformVisibilityKey,
  visibility: PlatformVisibility | undefined,
  hasBoundAccount: (provider: 'steam' | 'bangumi' | 'vndb' | 'ymgal') => boolean,
): boolean {
  const featureValue = visibility?.[getPlatformFeatureKey(category, platform)]
  if (typeof featureValue === 'boolean') return featureValue

  const legacyValue = visibility?.[platform]
  if (typeof legacyValue === 'boolean') return legacyValue

  return isDefaultVisiblePlatform(platform, hasBoundAccount)
}

export function isPlatformConfigVisible(
  platform: PlatformVisibilityKey,
  visibility: PlatformVisibility | undefined,
  hasBoundAccount: (provider: 'steam' | 'bangumi' | 'vndb' | 'ymgal') => boolean,
): boolean {
  const categories = getCategoriesForPlatform(platform)
  if (categories.length === 0) {
    const legacyValue = visibility?.[platform]
    if (typeof legacyValue === 'boolean') return legacyValue
    return isDefaultVisiblePlatform(platform, hasBoundAccount)
  }
  return categories.some((category) =>
    isPlatformFeatureEnabled(category, platform, visibility, hasBoundAccount),
  )
}

export const getPlatformVisibilityApi = async () =>
  readPlatformCache(
    'visibility',
    async () =>
      (
        await api.request<PlatformVisibility>({
          method: 'GET',
          url: '/settings/platform/visibility',
        })
      ).data,
  )

export const savePlatformVisibilityApi = async (data: {
  category: PlatformFeatureCategory
  platform: PlatformVisibilityKey
  visible: boolean
}) => {
  const response = await api.request<PlatformVisibility>({
    method: 'PATCH',
    url: '/settings/platform/visibility',
    data,
  })
  writePlatformCache('visibility', response.data)
  return response.data
}
