import { atomWithStorage } from 'jotai/utils'

import {
  createLayoutSyncedStorage,
  type GameLibraryLayout,
  isGameLibraryLayout,
} from '@/lib/settings/layout-settings'

export type { GameLibraryLayout }
export { isGameLibraryLayout }

export const gameLibraryLayoutAtom = atomWithStorage<GameLibraryLayout>(
  'vnweb.layout.game-library',
  'mixed',
  createLayoutSyncedStorage('gameLibraryLayout', isGameLibraryLayout),
)
