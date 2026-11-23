export type GameStatusSyncProvider = 'bangumi' | 'vndb'

export type GameStatusMappings = Record<number, Partial<Record<GameStatusSyncProvider, number>>>

export type GameStatusSyncResult = {
  provider: GameStatusSyncProvider
  success: boolean
  error?: string
}

export type GameStatusSyncAvailability = {
  provider: GameStatusSyncProvider
  linked: boolean
  mappedStatuses: number[]
  accountBound: boolean
  pushedStatuses: number[]
  pushedAt?: string
}

export type GameStatusPushState = 'unavailable' | 'unsynced' | 'pushed' | 'pending'

export type GameStatusPushColors = Record<GameStatusPushState, string>
