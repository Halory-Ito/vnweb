import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { getTempDir } from '@/lib/server/runtime-paths.mjs'

import type { NormalizedImportGame } from './types'
import type { ExternalImportPlatform } from '@/types/platform-import'

export type StoredImportSession = {
  sessionId: string
  platform: ExternalImportPlatform
  detectedFormat: string
  games: NormalizedImportGame[]
  warnings: string[]
  tempDir?: string
  createdAt: number
}

const SESSION_TTL_MS = 30 * 60 * 1000

declare global {
  var __vnwebPlatformImportSessions: Map<string, StoredImportSession> | undefined
}

function getSessionMap(): Map<string, StoredImportSession> {
  if (!globalThis.__vnwebPlatformImportSessions) {
    globalThis.__vnwebPlatformImportSessions = new Map<string, StoredImportSession>()
  }
  return globalThis.__vnwebPlatformImportSessions
}

async function cleanupSessionDir(session: StoredImportSession) {
  if (!session.tempDir) return
  await fs.rm(session.tempDir, { recursive: true, force: true }).catch(() => undefined)
}

export async function pruneExpiredImportSessions() {
  const map = getSessionMap()
  const now = Date.now()
  const expired: StoredImportSession[] = []

  for (const [id, session] of map.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      map.delete(id)
      expired.push(session)
    }
  }

  await Promise.all(expired.map((item) => cleanupSessionDir(item)))
}

export function createImportTempDir(sessionId: string): string {
  return path.join(getTempDir(), 'platform-import', sessionId)
}

export function generateImportSessionId(): string {
  return crypto.randomUUID()
}

export async function saveImportSession(
  session: StoredImportSession,
): Promise<StoredImportSession> {
  await pruneExpiredImportSessions()
  const map = getSessionMap()
  map.set(session.sessionId, session)
  return session
}

export async function getImportSession(sessionId: string): Promise<StoredImportSession | null> {
  await pruneExpiredImportSessions()
  const session = getSessionMap().get(sessionId)
  if (!session) return null
  session.createdAt = Date.now()
  return session
}

export async function deleteImportSession(sessionId: string): Promise<void> {
  const map = getSessionMap()
  const session = map.get(sessionId)
  if (!session) return
  map.delete(sessionId)
  await cleanupSessionDir(session)
}
