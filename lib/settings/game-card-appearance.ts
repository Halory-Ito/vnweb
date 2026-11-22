import { atomWithStorage } from 'jotai/utils'

import {
  createLayoutSyncedStorage,
  DEFAULT_LAYOUT_SETTINGS,
  isGameCardRadius,
} from './layout-settings'

export const gameCardTitleHiddenAtom = atomWithStorage(
  'vnweb.layout.game-card-title-hidden',
  DEFAULT_LAYOUT_SETTINGS.gameCardTitleHidden,
  createLayoutSyncedStorage(
    'gameCardTitleHidden',
    (value): value is boolean => typeof value === 'boolean',
  ),
)

export const gameCardRadiusAtom = atomWithStorage(
  'vnweb.layout.game-card-radius',
  DEFAULT_LAYOUT_SETTINGS.gameCardRadius,
  createLayoutSyncedStorage('gameCardRadius', isGameCardRadius),
)
