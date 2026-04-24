import { atom } from 'jotai'

import type { GameFilterState } from '@/types/game-types'

const fontAtom = atom('')

const bgAtom = atom('')

const selectedGameIdsAtom = atom<string[]>([])

const gameSearchAtom = atom('')

const showNsfwAtom = atom(true)

const defaultGameFilter: GameFilterState = {
  releaseDateFrom: '',
  releaseDateTo: '',
  playStatus: '',
  developer: '',
  publisher: '',
  category: '',
  platform: '',
  tags: '',
  originalPainter: '',
  script: '',
  music: '',
  engine: '',
  planning: '',
}

const gameFilterAtom = atom<GameFilterState>(defaultGameFilter)

export {
  fontAtom,
  bgAtom,
  selectedGameIdsAtom,
  gameSearchAtom,
  showNsfwAtom,
  gameFilterAtom,
  defaultGameFilter,
}
