import type { ExternalImportPlatform, PlatformImportOptionalColumn } from '@/types/platform-import'

export type PlatformImportSourceMeta = {
  id: ExternalImportPlatform
  label: string
  logo: string
  accept: string
  supportsDirectory: boolean
  supportsMemories: boolean
  supportsCharacters: boolean
  placeholderPath: string
}

export type PlatformImportOptionalColumnMeta = {
  id: PlatformImportOptionalColumn
  label: string
  requiresMemories?: boolean
  requiresCharacters?: boolean
}

export const PLATFORM_IMPORT_OPTIONAL_COLUMNS: readonly PlatformImportOptionalColumnMeta[] = [
  { id: 'developer', label: '开发商' },
  { id: 'playStatus', label: '游玩状态' },
  { id: 'records', label: '游玩记录' },
  { id: 'collections', label: '收藏夹' },
  { id: 'memories', label: '游戏回忆', requiresMemories: true },
  { id: 'characters', label: '角色资料', requiresCharacters: true },
  { id: 'matchInfo', label: '重复匹配' },
  { id: 'conflictAction', label: '处理方式' },
] as const

export function getAvailableOptionalColumns(
  sourceMeta: PlatformImportSourceMeta,
): PlatformImportOptionalColumnMeta[] {
  return PLATFORM_IMPORT_OPTIONAL_COLUMNS.filter((col) => {
    if (col.requiresMemories && !sourceMeta.supportsMemories) return false
    if (col.requiresCharacters && !sourceMeta.supportsCharacters) return false
    return true
  })
}

export function formatPlatformImportHours(seconds: number): string {
  if (!seconds || seconds <= 0) return '0h'
  return `${(seconds / 3600).toFixed(1)}h`
}

export const PLATFORM_IMPORT_SOURCES: readonly PlatformImportSourceMeta[] = [
  {
    id: 'playnite',
    label: 'Playnite',
    logo: '/logos/playnite.png',
    accept: '.zip,.json,.db',
    supportsDirectory: true,
    supportsMemories: false,
    supportsCharacters: false,
    placeholderPath: '例如：%APPDATA%\\Playnite\\library',
  },
  {
    id: 'vnite',
    label: 'Vnite',
    logo: '/logos/vnite.png',
    accept: '.zip,.json',
    supportsDirectory: true,
    supportsMemories: true,
    supportsCharacters: false,
    placeholderPath: '例如：%APPDATA%\\vnite\\app\\database',
  },
  {
    id: 'potatovn',
    label: 'PotatoVN',
    logo: '/logos/potatovn.png',
    accept: '.zip,.json',
    supportsDirectory: true,
    supportsMemories: false,
    supportsCharacters: true,
    placeholderPath: '例如：PotatoVN 导出目录或 .PotatoVN 目录',
  },
] as const

export function getPlatformImportSource(
  platform: ExternalImportPlatform,
): PlatformImportSourceMeta {
  return PLATFORM_IMPORT_SOURCES.find((item) => item.id === platform) ?? PLATFORM_IMPORT_SOURCES[0]
}
