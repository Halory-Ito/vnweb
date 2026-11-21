import { sql } from 'drizzle-orm'

import { db } from '@/lib/drizzle'

import type { PvMetadata } from '@/types/pv'

let schemaReady: Promise<unknown> | undefined

export function ensurePvMetadataSchema() {
  schemaReady ??= db
    .run(sql`
    CREATE TABLE IF NOT EXISTS game_pv_metadata (
      pvId integer PRIMARY KEY REFERENCES game_pv(id) ON DELETE CASCADE,
      metadata text NOT NULL
    )
  `)
    .catch((error) => {
      schemaReady = undefined
      throw error
    })
  return schemaReady
}

export function normalizePvMetadata(value: unknown): PvMetadata | undefined {
  if (!value || typeof value !== 'object') return undefined

  const { category, style, year, character, purpose, duration } = value as Partial<PvMetadata>
  const clean = (field: unknown) => (typeof field === 'string' ? field.trim().slice(0, 100) : '')

  return {
    category: clean(category),
    style: clean(style),
    year: typeof year === 'string' && /^\d{4}$/.test(year.trim()) ? year.trim() : '',
    character: clean(character),
    purpose: clean(purpose),
    duration:
      typeof duration === 'number' && Number.isFinite(duration) && duration > 0
        ? Math.min(Math.max(1, Math.round(duration)), 359999)
        : null,
  }
}
