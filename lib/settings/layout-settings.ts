import { unstable_withStorageValidator } from 'jotai/utils'
import { createJSONStorage } from 'jotai/vanilla/utils'

import { isGameMetadataField, type GameMetadataField } from '@/lib/game-metadata-fields'
import { api } from '@/lib/request-utils'
import { isAppearanceImageSource } from '@/lib/settings/appearance-image'

export type GameLibraryLayout = 'mixed' | 'grid' | 'hybrid'
export type GridDisplay = 'folders' | 'sections' | 'ungrouped'
export type LayoutLibraryGroup = 'status' | GameMetadataField

export type LayoutSettings = {
  sidebarHidden: boolean
  headerHidden: boolean
  borderless: boolean
  gameLibraryLayout: GameLibraryLayout
  gameLibraryGridDisplay: GridDisplay
  gameLibraryGroup: LayoutLibraryGroup
  gameCardTitleHidden: boolean
  gameCardRadius: number
  folderPalette: string[]
  folderColors: Record<string, string>
  folderLogos: Record<string, string>
}

export const DEFAULT_FOLDER_PALETTE = ['#5b85d6', '#4b9c8d', '#a17bd3', '#ce805d', '#bd6e94']
export const MAX_FOLDER_PALETTE_SIZE = 16
export const MAX_GAME_CARD_RADIUS = 40

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  sidebarHidden: false,
  headerHidden: false,
  borderless: false,
  gameLibraryLayout: 'mixed',
  gameLibraryGridDisplay: 'folders',
  gameLibraryGroup: 'status',
  gameCardTitleHidden: false,
  gameCardRadius: 10,
  folderPalette: DEFAULT_FOLDER_PALETTE,
  folderColors: {},
  folderLogos: {},
}

export const isFolderColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)

export const isGameCardRadius = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= MAX_GAME_CARD_RADIUS

export const isGameLibraryLayout = (value: unknown): value is GameLibraryLayout =>
  value === 'mixed' || value === 'grid' || value === 'hybrid'

export const isGridDisplay = (value: unknown): value is GridDisplay =>
  value === 'folders' || value === 'sections' || value === 'ungrouped'

export const isLayoutLibraryGroup = (value: unknown): value is LayoutLibraryGroup =>
  value === 'status' || isGameMetadataField(value)

export function resolveLayoutLibraryGroup(
  value: unknown,
  legacyField?: unknown,
): LayoutLibraryGroup {
  if (value === 'custom') return isGameMetadataField(legacyField) ? legacyField : 'platforms'
  return isLayoutLibraryGroup(value) ? value : DEFAULT_LAYOUT_SETTINGS.gameLibraryGroup
}

export const isFolderPalette = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= MAX_FOLDER_PALETTE_SIZE && value.every(isFolderColor)

export const isFolderColors = (value: unknown): value is Record<string, string> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.values(value).every(isFolderColor)

export const isFolderLogos = (value: unknown): value is Record<string, string> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.values(value).every(isAppearanceImageSource)

export function normalizeLayoutSettings(
  input: Partial<LayoutSettings> | Record<string, unknown> | null | undefined,
): LayoutSettings {
  const source = (input ?? {}) as Record<string, unknown>
  return {
    sidebarHidden:
      typeof source.sidebarHidden === 'boolean'
        ? source.sidebarHidden
        : DEFAULT_LAYOUT_SETTINGS.sidebarHidden,
    headerHidden:
      typeof source.headerHidden === 'boolean'
        ? source.headerHidden
        : DEFAULT_LAYOUT_SETTINGS.headerHidden,
    borderless:
      typeof source.borderless === 'boolean'
        ? source.borderless
        : DEFAULT_LAYOUT_SETTINGS.borderless,
    gameLibraryLayout: isGameLibraryLayout(source.gameLibraryLayout)
      ? source.gameLibraryLayout
      : DEFAULT_LAYOUT_SETTINGS.gameLibraryLayout,
    gameLibraryGridDisplay: isGridDisplay(source.gameLibraryGridDisplay)
      ? source.gameLibraryGridDisplay
      : DEFAULT_LAYOUT_SETTINGS.gameLibraryGridDisplay,
    gameLibraryGroup: resolveLayoutLibraryGroup(source.gameLibraryGroup, source.libraryGroupField),
    gameCardTitleHidden:
      typeof source.gameCardTitleHidden === 'boolean'
        ? source.gameCardTitleHidden
        : DEFAULT_LAYOUT_SETTINGS.gameCardTitleHidden,
    gameCardRadius: isGameCardRadius(source.gameCardRadius)
      ? source.gameCardRadius
      : DEFAULT_LAYOUT_SETTINGS.gameCardRadius,
    folderPalette: isFolderPalette(source.folderPalette)
      ? source.folderPalette
      : DEFAULT_LAYOUT_SETTINGS.folderPalette,
    folderColors: isFolderColors(source.folderColors)
      ? source.folderColors
      : DEFAULT_LAYOUT_SETTINGS.folderColors,
    folderLogos: isFolderLogos(source.folderLogos)
      ? source.folderLogos
      : DEFAULT_LAYOUT_SETTINGS.folderLogos,
  }
}

export type LayoutConfigResponse = {
  data: LayoutSettings
  persisted: boolean
}

export async function getLayoutConfigApi(): Promise<LayoutConfigResponse> {
  const response = await api.request<LayoutConfigResponse>({
    method: 'GET',
    url: '/settings/appearance/layout',
  })
  return response.data
}

export async function updateLayoutConfigApi(
  patch: Partial<LayoutSettings>,
): Promise<LayoutConfigResponse> {
  const response = await api.request<LayoutConfigResponse>({
    method: 'POST',
    url: '/settings/appearance/layout',
    data: patch,
  })
  return response.data
}

let suppressLayoutSyncDepth = 0
let pendingLayoutPatch: Partial<LayoutSettings> = {}
let syncTimer: ReturnType<typeof setTimeout> | null = null

export function runWithoutLayoutSync(fn: () => void) {
  suppressLayoutSyncDepth += 1
  try {
    fn()
  } finally {
    suppressLayoutSyncDepth -= 1
  }
}

function scheduleLayoutPatch(patch: Partial<LayoutSettings>) {
  pendingLayoutPatch = { ...pendingLayoutPatch, ...patch }
  if (syncTimer) {
    clearTimeout(syncTimer)
  }
  syncTimer = setTimeout(() => {
    const nextPatch = pendingLayoutPatch
    pendingLayoutPatch = {}
    syncTimer = null
    void updateLayoutConfigApi(nextPatch).catch((error) => {
      console.error('Sync layout settings failed:', error)
    })
  }, 300)
}

export function createLayoutSyncedStorage<K extends keyof LayoutSettings>(
  configKey: K,
  validator: (value: unknown) => value is LayoutSettings[K],
) {
  const baseStorage = unstable_withStorageValidator(validator)(
    createJSONStorage<unknown>(() => window.localStorage),
  )

  return {
    ...baseStorage,
    setItem(key: string, newValue: LayoutSettings[K]) {
      baseStorage.setItem(key, newValue)
      if (suppressLayoutSyncDepth === 0) {
        scheduleLayoutPatch({ [configKey]: newValue } as Partial<LayoutSettings>)
      }
    },
  }
}
