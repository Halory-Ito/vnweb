import type { PvManageItem, PvMetadata } from '@/types'

export type PvFormState = {
  gameId: string
  name: string
  url: string
  metadata: PvMetadata
}

export type GameOption = {
  id: string
  label: string
}

export type PvPlayerMode = 'none' | 'direct' | 'embed'

export type PvItem = PvManageItem
