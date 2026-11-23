export const platformVisibilityKeys = [
  'steam',
  'bangumi',
  'vndb',
  'ymgal',
  'meting',
  'enhanced',
] as const
export type PlatformVisibilityKey = (typeof platformVisibilityKeys)[number]
export type PlatformVisibility = Partial<Record<PlatformVisibilityKey, boolean>>
