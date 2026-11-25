import { migrate } from 'drizzle-orm/libsql/migrator'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { db } from '@/lib/drizzle'
import { getDatabaseUrl, getDbPath } from '@/lib/server/database-config.mjs'
import { getDrizzleMigrationsDir } from '@/lib/server/runtime-paths.mjs'

type JournalEntry = {
  idx: number
  version: string
  when: number
  tag: string
  breakpoints: boolean
}

type Journal = {
  entries: JournalEntry[]
}

const globalForMigration = globalThis as typeof globalThis & {
  __vnwebDbMigrationPromise?: Promise<void>
}

function ensureLocalDbDirectoryExists() {
  const url = getDatabaseUrl()
  if (!url.startsWith('file:') || url.includes(':memory:')) {
    return
  }
  const dbPath = getDbPath()
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await db.$client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: [tableName],
  })
  return res.rows.length > 0
}

function makeIdempotentDdl(statement: string): string {
  return statement
    .replace(/^CREATE TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ')
    .replace(/^CREATE UNIQUE INDEX\s+/i, 'CREATE UNIQUE INDEX IF NOT EXISTS ')
    .replace(/^CREATE INDEX\s+/i, 'CREATE INDEX IF NOT EXISTS ')
}

async function adoptLegacyDatabaseIfNeeded(migrationsFolder: string): Promise<void> {
  const journalPath = path.join(migrationsFolder, 'meta', '_journal.json')
  if (!fs.existsSync(journalPath)) {
    throw new Error(`找不到迁移清单文件: ${journalPath}`)
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as Journal
  const baseline = journal.entries[0]
  if (!baseline) {
    return
  }

  const hasGameInfo = await tableExists('game_info')
  if (!hasGameInfo) {
    return
  }

  const hasMigrationsTable = await tableExists('__drizzle_migrations')
  let maxCreatedAt = 0
  if (hasMigrationsTable) {
    const res = await db.$client.execute(
      'SELECT MAX(CAST(created_at AS INTEGER)) AS maxCreatedAt FROM "__drizzle_migrations"',
    )
    const raw = res.rows[0]?.maxCreatedAt
    maxCreatedAt = typeof raw === 'number' ? raw : Number(raw ?? 0)
  }

  if (Number.isFinite(maxCreatedAt) && maxCreatedAt >= baseline.when) {
    return
  }

  const baselineSqlPath = path.join(migrationsFolder, `${baseline.tag}.sql`)
  const baselineSql = fs.readFileSync(baselineSqlPath, 'utf8')
  const baselineHash = crypto.createHash('sha256').update(baselineSql).digest('hex')

  const statements = baselineSql
    .split('--> statement-breakpoint')
    .map((stmt) => stmt.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    await db.$client.execute(makeIdempotentDdl(stmt))
  }

  const gamePlayColumnsRes = await db.$client.execute("PRAGMA table_info('game_play')")
  const existingCols = new Set(gamePlayColumnsRes.rows.map((row) => String(row.name ?? '')))
  if (!existingCols.has('completedAt')) {
    await db.$client.execute("ALTER TABLE `game_play` ADD `completedAt` text DEFAULT ''")
  }
  if (!existingCols.has('pid')) {
    await db.$client.execute('ALTER TABLE `game_play` ADD `pid` integer DEFAULT 0')
  }

  await db.$client.execute(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `)

  await db.$client.execute({
    sql: 'INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)',
    args: [baselineHash, baseline.when],
  })
}

async function runMigrations(): Promise<void> {
  ensureLocalDbDirectoryExists()
  const migrationsFolder = getDrizzleMigrationsDir()
  await adoptLegacyDatabaseIfNeeded(migrationsFolder)
  await migrate(db, { migrationsFolder })
}

export function ensureDatabaseMigrated(): Promise<void> {
  if (!globalForMigration.__vnwebDbMigrationPromise) {
    globalForMigration.__vnwebDbMigrationPromise = runMigrations().catch((error) => {
      globalForMigration.__vnwebDbMigrationPromise = undefined
      throw error
    })
  }
  return globalForMigration.__vnwebDbMigrationPromise
}
