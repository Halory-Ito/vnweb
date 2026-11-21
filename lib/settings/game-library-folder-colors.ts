import { atomWithStorage } from 'jotai/utils'

import {
  createLayoutSyncedStorage,
  DEFAULT_FOLDER_PALETTE,
  isFolderColor,
  isFolderColors,
  isFolderPalette,
  MAX_FOLDER_PALETTE_SIZE,
} from '@/lib/settings/layout-settings'

type FolderColors = Record<string, string>

export { DEFAULT_FOLDER_PALETTE, isFolderColor, MAX_FOLDER_PALETTE_SIZE }

export const folderPaletteAtom = atomWithStorage<string[]>(
  'vnweb.layout.game-library-folder-palette',
  DEFAULT_FOLDER_PALETTE,
  createLayoutSyncedStorage('folderPalette', isFolderPalette),
)

export function getFolderPaletteColor(palette: string[], index: number): string | undefined {
  return palette.length ? palette[index % palette.length] : undefined
}

export const folderColorsAtom = atomWithStorage<FolderColors>(
  'vnweb.layout.game-library-folder-colors',
  {},
  createLayoutSyncedStorage('folderColors', isFolderColors),
)
