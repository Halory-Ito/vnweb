import { atomWithStorage, unstable_withStorageValidator } from 'jotai/utils'
import { createJSONStorage } from 'jotai/vanilla/utils'

export type GameLibraryLayout = 'mixed' | 'grid'

export const isGameLibraryLayout = (value: unknown): value is GameLibraryLayout =>
  value === 'mixed' || value === 'grid'

export const gameLibraryLayoutAtom = atomWithStorage(
  'vnweb.layout.game-library',
  'mixed',
  unstable_withStorageValidator(isGameLibraryLayout)(
    createJSONStorage<unknown>(() => window.localStorage),
  ),
)
