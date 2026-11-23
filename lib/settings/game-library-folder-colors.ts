import { atomWithStorage } from 'jotai/utils'

import {
  createLayoutSyncedStorage,
  DEFAULT_FOLDER_PALETTE,
  DEFAULT_LAYOUT_SETTINGS,
  type FolderPaletteMode,
  isFolderColor,
  isFolderColors,
  isFolderPalette,
  isFolderPaletteMode,
  MAX_FOLDER_PALETTE_SIZE,
} from '@/lib/settings/layout-settings'

type FolderColors = Record<string, string>

export { DEFAULT_FOLDER_PALETTE, isFolderColor, MAX_FOLDER_PALETTE_SIZE }

export const folderPaletteAtom = atomWithStorage<string[]>(
  'vnweb.layout.game-library-folder-palette',
  DEFAULT_FOLDER_PALETTE,
  createLayoutSyncedStorage('folderPalette', isFolderPalette),
)

export const folderPaletteModeAtom = atomWithStorage<FolderPaletteMode>(
  'vnweb.layout.game-library-folder-palette-mode',
  DEFAULT_LAYOUT_SETTINGS.folderPaletteMode,
  createLayoutSyncedStorage('folderPaletteMode', isFolderPaletteMode),
)

export function getFolderPaletteColor(
  palette: string[],
  index: number,
  mode: FolderPaletteMode,
  folderKey: string,
): string | undefined {
  if (!palette.length) return undefined
  if (mode === 'cycle') return palette[index % palette.length]

  // Hash the folder key so random colors stay stable across renders and reordering.
  let hash = 2166136261
  for (let i = 0; i < folderKey.length; i++) {
    hash = Math.imul(hash ^ folderKey.charCodeAt(i), 16777619)
  }
  return palette[(hash >>> 0) % palette.length]
}

export const folderColorsAtom = atomWithStorage<FolderColors>(
  'vnweb.layout.game-library-folder-colors',
  {},
  createLayoutSyncedStorage('folderColors', isFolderColors),
)
