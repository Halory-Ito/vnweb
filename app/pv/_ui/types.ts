import type { PvManageItem } from '@/lib/game-utils'

export type ViewMode = 'grid' | 'list'

export type PvFormState = {
  gameId: string
  name: string
  url: string
}

export type GameOption = {
  id: string
  label: string
}

export type PvPlayerMode = 'none' | 'direct' | 'embed'

export type PvItem = PvManageItem
