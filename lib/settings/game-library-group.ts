import { atomWithStorage } from 'jotai/utils'

import {
  createLayoutSyncedStorage,
  isLayoutLibraryGroup,
  type LayoutLibraryGroup,
} from '@/lib/settings/layout-settings'

export const gameLibraryGroupAtom = atomWithStorage<LayoutLibraryGroup>(
  'vnweb.layout.game-library-group',
  'status',
  createLayoutSyncedStorage('gameLibraryGroup', isLayoutLibraryGroup),
)
