import { atomWithStorage, unstable_withStorageValidator } from 'jotai/utils'
import { createJSONStorage } from 'jotai/vanilla/utils'

type FolderColors = Record<string, string>

export const isFolderColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)

export const DEFAULT_FOLDER_PALETTE = ['#5b85d6', '#4b9c8d', '#a17bd3', '#ce805d', '#bd6e94']
export const MAX_FOLDER_PALETTE_SIZE = 16

export const folderPaletteAtom = atomWithStorage<string[]>(
  'vnweb.layout.game-library-folder-palette',
  DEFAULT_FOLDER_PALETTE,
  unstable_withStorageValidator(
    (value): value is string[] =>
      Array.isArray(value) && value.length <= MAX_FOLDER_PALETTE_SIZE && value.every(isFolderColor),
  )(createJSONStorage<unknown>(() => window.localStorage)),
)

export function getFolderPaletteColor(palette: string[], index: number): string | undefined {
  return palette.length ? palette[index % palette.length] : undefined
}

export const folderColorsAtom = atomWithStorage<FolderColors>(
  'vnweb.layout.game-library-folder-colors',
  {},
  unstable_withStorageValidator(
    (value): value is FolderColors =>
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.values(value).every(isFolderColor),
  )(createJSONStorage<unknown>(() => window.localStorage)),
)
