export type ExternalImportPlatform = 'playnite' | 'vnite' | 'potatovn'

export type PlatformImportConflictStrategy = 'keep_existing' | 'merge' | 'replace_with_imported'

export type PlatformImportMatchType = 'external_id' | 'name'

export type PlatformImportOptionalColumn =
  | 'developer'
  | 'playStatus'
  | 'records'
  | 'collections'
  | 'memories'
  | 'characters'
  | 'matchInfo'
  | 'conflictAction'

export type PlatformImportOptions = {
  conflictStrategy: PlatformImportConflictStrategy
  importPlayRecords: boolean
  importImages: boolean
  importCollections: boolean
  importMemories: boolean
  importCharacters: boolean
}

export type PlatformDetectedPath = {
  platform: ExternalImportPlatform
  path: string
  exists: boolean
}

export type PlatformImportPreviewItem = {
  sourceId: string
  name: string
  nameCn: string
  developer: string
  date: string
  totalPlayTime: number
  playStatus: number
  playStatusLabel: string
  rating: number
  recordCount: number
  collectionNames: string[]
  memoryCount: number
  characterCount: number
  hasCover: boolean
  coverUrl?: string
  alreadyExists: boolean
  matchedGameId?: number
  matchedGameName?: string
  matchType?: PlatformImportMatchType
  matchDetail?: string
  matchedGamePlayTime?: number
  matchedGameRecordCount?: number
  matchedGameStatusLabel?: string
  externalIds: Array<{ provider: string; externalId: string }>
}

export type PlatformImportSessionPreview = {
  sessionId: string
  platform: ExternalImportPlatform
  detectedFormat: string
  items: PlatformImportPreviewItem[]
  collections: string[]
  stats: {
    totalGames: number
    existingGames: number
    newGames: number
    totalCollections: number
    totalRecords: number
    totalMemories: number
    totalCharacters: number
  }
  warnings: string[]
}

export type PlatformImportExecutePayload = {
  sessionId: string
  selectedSourceIds: string[]
  options: PlatformImportOptions
  itemStrategies?: Record<string, PlatformImportConflictStrategy>
}

export type PlatformImportExecuteItemResult = {
  sourceId: string
  name: string
  status: 'imported' | 'merged' | 'replaced' | 'skipped' | 'failed'
  gameId?: number
  reason?: string
}

export type PlatformImportExecuteResult = {
  importedCount: number
  mergedCount: number
  replacedCount: number
  skippedCount: number
  failedCount: number
  collectionsCreated: number
  recordsImported: number
  memoriesImported: number
  charactersImported: number
  items: PlatformImportExecuteItemResult[]
}
