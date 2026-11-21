import { atomWithStorage, unstable_withStorageValidator } from 'jotai/utils'
import { createJSONStorage } from 'jotai/vanilla/utils'

import type { LibraryGroup } from '@/features/home/lib/library-grouping'

export const gameLibraryGroupAtom = atomWithStorage(
  'vnweb.layout.game-library-group',
  'status',
  unstable_withStorageValidator(
    (value): value is LibraryGroup =>
      value === 'status' || value === 'developer' || value === 'publisher',
  )(createJSONStorage<unknown>(() => window.localStorage)),
)
