import { atomWithStorage, createJSONStorage } from 'jotai/utils'

import {
  createLayoutSyncedStorage,
  DEFAULT_LAYOUT_SETTINGS,
  isLayoutLibraryGroup,
  resolveLayoutLibraryGroup,
  type LayoutLibraryGroup,
} from '@/lib/settings/layout-settings'

const storage = createLayoutSyncedStorage('gameLibraryGroup', isLayoutLibraryGroup)
const storedJson = createJSONStorage<unknown>()

export const gameLibraryGroupAtom = atomWithStorage<LayoutLibraryGroup>(
  'vnweb.layout.game-library-group',
  DEFAULT_LAYOUT_SETTINGS.gameLibraryGroup,
  {
    ...storage,
    getItem(key, initialValue) {
      const group = storedJson.getItem(key, initialValue)
      const legacyField =
        group === 'custom'
          ? storedJson.getItem('vnweb.layout.library-group-field', undefined)
          : undefined
      return resolveLayoutLibraryGroup(group, legacyField)
    },
  },
)
