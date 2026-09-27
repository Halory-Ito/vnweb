import type { PvManageItem } from '@/types'

export type ViewMode = 'grid' | 'list'

export type PvFormState = {
  gameId: string
  name: string
  url: string
  uploadingFile?: File | null
}

export type GameOption = {
  id: string
  label: string
}

export type PvPlayerMode = 'none' | 'direct' | 'embed'

export type PvItem = PvManageItem
