import { GameInfoTable } from '@/db/schema'

import type { GameMetadataField } from '@/lib/game-metadata-fields'

export const gameMetadataSearchColumns = {
  developer: GameInfoTable.developer,
  publisher: GameInfoTable.publisher,
  date: GameInfoTable.date,
  gameType: GameInfoTable.gameType,
  gameEngine: GameInfoTable.gameEngine,
  platforms: GameInfoTable.platforms,
  music: GameInfoTable.music,
  script: GameInfoTable.script,
  graphic: GameInfoTable.graphic,
  originalPainter: GameInfoTable.originalPainter,
  animationProduction: GameInfoTable.animationProduction,
  programmer: GameInfoTable.programmer,
}

const metadataFields = Object.keys(gameMetadataSearchColumns) as GameMetadataField[]

export function getGameSearchMetadata(game: Record<GameMetadataField, string>) {
  const metadata: Partial<Record<GameMetadataField, string>> = {}
  for (const field of metadataFields) {
    const value = game[field].trim()
    if (value && value !== '-') metadata[field] = value
  }
  return metadata
}
