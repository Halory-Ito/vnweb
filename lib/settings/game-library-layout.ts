import { atomWithStorage } from 'jotai/utils'

import {
  createLayoutSyncedStorage,
  DEFAULT_LAYOUT_SETTINGS,
  type GameLibraryLayout,
  isGameLibraryLayout,
} from '@/lib/settings/layout-settings'

export type { GameLibraryLayout }
export { isGameLibraryLayout }

export const gameLibraryLayoutAtom = atomWithStorage<GameLibraryLayout>(
  'vnweb.layout.game-library',
  DEFAULT_LAYOUT_SETTINGS.gameLibraryLayout,
  createLayoutSyncedStorage('gameLibraryLayout', isGameLibraryLayout),
)
