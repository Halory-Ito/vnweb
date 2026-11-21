import { atomWithStorage } from 'jotai/utils'

import {
  createLayoutSyncedStorage,
  type GridDisplay,
  isGridDisplay,
} from '@/lib/settings/layout-settings'

export { isGridDisplay }

export const gameLibraryGridDisplayAtom = atomWithStorage<GridDisplay>(
  'vnweb.layout.game-library-grid-display',
  'folders',
  createLayoutSyncedStorage('gameLibraryGridDisplay', isGridDisplay),
)
