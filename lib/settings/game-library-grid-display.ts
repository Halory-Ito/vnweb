import { atomWithStorage, unstable_withStorageValidator } from 'jotai/utils'
import { createJSONStorage } from 'jotai/vanilla/utils'

type GridDisplay = 'folders' | 'sections' | 'ungrouped'

export const isGridDisplay = (value: unknown): value is GridDisplay =>
  value === 'folders' || value === 'sections' || value === 'ungrouped'

export const gameLibraryGridDisplayAtom = atomWithStorage(
  'vnweb.layout.game-library-grid-display',
  'folders',
  unstable_withStorageValidator(isGridDisplay)(
    createJSONStorage<unknown>(() => window.localStorage),
  ),
)
