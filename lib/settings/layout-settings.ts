import { unstable_withStorageValidator } from 'jotai/utils'
import { createJSONStorage } from 'jotai/vanilla/utils'

import { isGameMetadataField, type GameMetadataField } from '@/lib/game-metadata-fields'
import { api } from '@/lib/request-utils'
import { isAppearanceImageSource } from '@/lib/settings/appearance-image'

export type GameLibraryLayout = 'mixed' | 'grid' | 'hybrid'
export type FolderPaletteMode = 'cycle' | 'random'
export type GridDisplay = 'folders' | 'sections' | 'ungrouped'
export type LayoutLibraryGroup = 'status' | GameMetadataField

export type LayoutSettings = {
  sidebarHidden: boolean
  headerHidden: boolean
  borderless: boolean
  nativeTitleBar: boolean
  gameLibraryLayout: GameLibraryLayout
  gameLibraryGridDisplay: GridDisplay
  gameLibraryGroup: LayoutLibraryGroup
  gameCardTitleHidden: boolean
  gameCardRadius: number
  folderPalette: string[]
  folderPaletteMode: FolderPaletteMode
  folderColors: Record<string, string>
  folderLogos: Record<string, string>
}

export const DEFAULT_FOLDER_PALETTE = ['#5b85d6', '#4b9c8d', '#a17bd3', '#ce805d', '#bd6e94']
export const MAX_FOLDER_PALETTE_SIZE = 16
export const MAX_GAME_CARD_RADIUS = 40
export const BORDERLESS_STORAGE_KEY = 'vnweb.layout.borderless'

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  sidebarHidden: false,
  headerHidden: false,
  borderless: true,
  nativeTitleBar: true,
  gameLibraryLayout: 'hybrid',
  gameLibraryGridDisplay: 'folders',
  gameLibraryGroup: 'developer',
  gameCardTitleHidden: false,
  gameCardRadius: 10,
  folderPalette: DEFAULT_FOLDER_PALETTE,
  folderPaletteMode: 'cycle',
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

export const isFolderPaletteMode = (value: unknown): value is FolderPaletteMode =>
  value === 'cycle' || value === 'random'

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
    nativeTitleBar:
      typeof source.nativeTitleBar === 'boolean'
        ? source.nativeTitleBar
        : DEFAULT_LAYOUT_SETTINGS.nativeTitleBar,
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
    folderPaletteMode: isFolderPaletteMode(source.folderPaletteMode)
      ? source.folderPaletteMode
      : DEFAULT_LAYOUT_SETTINGS.folderPaletteMode,
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
let layoutSyncChain: Promise<void> = Promise.resolve()
const userModifiedLayoutKeys = new Set<keyof LayoutSettings>()

export function hasUserModifiedLayoutKey(key: keyof LayoutSettings): boolean {
  return userModifiedLayoutKeys.has(key)
}

export function runWithoutLayoutSync(fn: () => void) {
  suppressLayoutSyncDepth += 1
  try {
    fn()
  } finally {
    suppressLayoutSyncDepth -= 1
  }
}

function flushLayoutPatch() {
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }
  if (Object.keys(pendingLayoutPatch).length === 0) {
    return
  }

  const nextPatch = pendingLayoutPatch
  pendingLayoutPatch = {}
  layoutSyncChain = layoutSyncChain
    .then(() => updateLayoutConfigApi(nextPatch))
    .then(
      () => undefined,
      (error) => {
        console.error('Sync layout settings failed:', error)
      },
    )
}

function scheduleLayoutPatch(patch: Partial<LayoutSettings>, immediate = false) {
  pendingLayoutPatch = { ...pendingLayoutPatch, ...patch }
  if (immediate) {
    flushLayoutPatch()
    return
  }
  if (syncTimer) {
    clearTimeout(syncTimer)
  }
  syncTimer = setTimeout(flushLayoutPatch, 300)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function areLayoutSettingValuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => Object.is(item, b[index]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every(
      (key) => Object.prototype.hasOwnProperty.call(b, key) && Object.is(a[key], b[key]),
    )
  }
  return false
}

function readLocalStorageRaw(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function createLayoutSyncedStorage<K extends keyof LayoutSettings>(
  configKey: K,
  validator: (value: unknown) => value is LayoutSettings[K],
  options?: { immediate?: boolean },
) {
  const baseStorage = unstable_withStorageValidator(validator)(
    createJSONStorage<unknown>(() => window.localStorage),
  )
  let hasCached = false
  let lastRaw: string | null = null
  let lastValue: LayoutSettings[K]

  const storage: typeof baseStorage = {
    getItem(key, initialValue) {
      if (typeof window === 'undefined') {
        return initialValue
      }

      const raw = readLocalStorageRaw(key)
      if (hasCached && raw === lastRaw) {
        return lastValue
      }

      const next = baseStorage.getItem(key, initialValue)
      if (hasCached && areLayoutSettingValuesEqual(lastValue, next)) {
        lastRaw = raw
        return lastValue
      }

      hasCached = true
      lastRaw = raw
      lastValue = next
      return next
    },
    setItem(key, newValue) {
      baseStorage.setItem(key, newValue)
      hasCached = true
      lastValue = newValue
      lastRaw = readLocalStorageRaw(key)
      if (suppressLayoutSyncDepth === 0) {
        userModifiedLayoutKeys.add(configKey)
        scheduleLayoutPatch(
          { [configKey]: newValue } as Partial<LayoutSettings>,
          options?.immediate,
        )
      }
    },
    removeItem(key) {
      hasCached = false
      lastRaw = null
      baseStorage.removeItem(key)
    },
    ...(baseStorage.subscribe
      ? {
          subscribe(key, callback, initialValue) {
            return baseStorage.subscribe!(
              key,
              () => {
                callback(storage.getItem(key, initialValue))
              },
              initialValue,
            )
          },
        }
      : {}),
  }

  return storage
}
