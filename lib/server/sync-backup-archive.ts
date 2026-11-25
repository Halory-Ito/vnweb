import archiver from 'archiver'
import fs from 'node:fs'
import path from 'node:path'

import type { BackupAssetFile } from '@/lib/server/backup-content'
import type { BackupContentOptions } from '@/types'

export const SYNC_BACKUP_ARCHIVE_FILENAME = 'backup.zip'

const ALLOWED_ARCHIVE_PREFIXES = [
  'database/',
  'settings/',
  'assets/',
  'public-assets/',
  'game-saves/',
] as const

export type InspectedSyncArchive = {
  hasLocalDb: boolean
  hasSettings: boolean
  hasGameSaves: boolean
  hasAssets: boolean
  hasPublicAssets: boolean
  assetSubEntries: string[]
  publicAssetSubEntries: string[]
  entryCount: number
  uncompressedBytes: number
}

export type ExtractedSyncArchive = {
  dbPath: string | null
  settingsDir: string
  assetsDir: string
  publicAssetsDir: string
  gameSavesDir: string
}

function normalizeArchiveEntryPath(rawName: string): string {
  return rawName.replace(/\\/g, '/').replace(/^\/+/, '')
}

function isSafeArchiveEntryPath(normalizedPath: string): boolean {
  if (!normalizedPath || normalizedPath.includes('\0')) return false
  const segments = normalizedPath.split('/').filter(Boolean)
  if (segments.length === 0) return false
  return segments.every((segment) => segment !== '.' && segment !== '..')
}

function isAllowedArchiveFile(normalizedPath: string): boolean {
  if (normalizedPath === 'local.db') return true
  return ALLOWED_ARCHIVE_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))
}

export async function createSyncBackupArchive(params: {
  dbPath: string
  assetFiles: BackupAssetFile[]
  settingsFiles: BackupAssetFile[]
  gameSaveDir: string | null
  options: BackupContentOptions
  outputPath: string
  uncompressedTotalSize: number
  onProgress?: (processedBytes: number, totalBytes: number) => void
}): Promise<{ archiveSize: number }> {
  const {
    dbPath,
    assetFiles,
    settingsFiles,
    gameSaveDir,
    options,
    outputPath,
    uncompressedTotalSize,
    onProgress,
  } = params

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true })

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 6 } })
    let settled = false

    const fail = (error: Error) => {
      if (settled) return
      settled = true
      archive.destroy()
      output.destroy()
      reject(error)
    }

    output.on('close', () => {
      if (settled) return
      settled = true
      resolve()
    })
    output.on('error', (error: Error) => fail(error))
    archive.on('warning', (error: Error & { code?: string }) => {
      if (error.code !== 'ENOENT') {
        fail(error)
      }
    })
    archive.on('error', (error: Error) => fail(error))
    archive.on('progress', (progress) => {
      onProgress?.(progress.fs.processedBytes, uncompressedTotalSize)
    })

    archive.pipe(output)

    if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: 'database/local.db' })
    }
    for (const file of assetFiles) {
      archive.file(file.localPath, { name: file.archivePath })
    }
    for (const file of settingsFiles) {
      archive.file(file.localPath, { name: file.archivePath })
    }
    if (gameSaveDir && fs.existsSync(gameSaveDir)) {
      archive.directory(gameSaveDir, 'game-saves')
    }

    const backupInfo = {
      version: '2.0.0',
      createdAt: new Date().toISOString(),
      description: 'VNWeb Sync Backup',
      content: options,
    }
    archive.append(JSON.stringify(backupInfo, null, 2), { name: 'backup-info.json' })

    void archive.finalize().catch((error: unknown) => {
      fail(error instanceof Error ? error : new Error(String(error)))
    })
  })

  const stat = await fs.promises.stat(outputPath)
  return { archiveSize: stat.size }
}

export async function inspectSyncBackupArchive(zipPath: string): Promise<InspectedSyncArchive> {
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip(zipPath)
  const assetSubSet = new Set<string>()
  const publicAssetSubSet = new Set<string>()

  let hasLocalDb = false
  let hasSettings = false
  let hasGameSaves = false
  let hasAssets = false
  let hasPublicAssets = false
  let entryCount = 0
  let uncompressedBytes = 0

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue
    const entryPath = normalizeArchiveEntryPath(entry.entryName)
    if (!isSafeArchiveEntryPath(entryPath) || !isAllowedArchiveFile(entryPath)) continue

    entryCount += 1
    uncompressedBytes += Math.max(0, entry.header.size || 0)

    if (entryPath === 'local.db' || entryPath === 'database/local.db') {
      hasLocalDb = true
      continue
    }
    if (entryPath.startsWith('settings/')) {
      hasSettings = true
      continue
    }
    if (entryPath.startsWith('game-saves/')) {
      hasGameSaves = true
      continue
    }
    if (entryPath.startsWith('assets/')) {
      hasAssets = true
      const subSegment = entryPath.slice('assets/'.length).split('/')[0]
      if (subSegment) assetSubSet.add(subSegment)
      continue
    }
    if (entryPath.startsWith('public-assets/')) {
      hasPublicAssets = true
      const subSegment = entryPath.slice('public-assets/'.length).split('/')[0]
      if (subSegment) publicAssetSubSet.add(subSegment)
    }
  }

  return {
    hasLocalDb,
    hasSettings,
    hasGameSaves,
    hasAssets,
    hasPublicAssets,
    assetSubEntries: [...assetSubSet],
    publicAssetSubEntries: [...publicAssetSubSet],
    entryCount,
    uncompressedBytes,
  }
}

export async function extractSyncBackupArchive(
  zipPath: string,
  targetDir: string,
  onProgress?: (processed: number, total: number) => void,
): Promise<ExtractedSyncArchive> {
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip(zipPath)
  const resolvedRoot = path.resolve(targetDir)
  await fs.promises.mkdir(resolvedRoot, { recursive: true })

  const extractable = zip
    .getEntries()
    .filter((entry) => {
      if (entry.isDirectory) return false
      const entryPath = normalizeArchiveEntryPath(entry.entryName)
      return isSafeArchiveEntryPath(entryPath) && isAllowedArchiveFile(entryPath)
    })
    .map((entry) => ({
      entry,
      entryPath: normalizeArchiveEntryPath(entry.entryName),
      size: Math.max(0, entry.header.size || 0),
    }))

  const totalBytes = extractable.reduce((sum, item) => sum + item.size, 0)
  const totalCount = extractable.length
  let processedBytes = 0
  let processedCount = 0
  let dbPath: string | null = null

  onProgress?.(0, totalBytes > 0 ? totalBytes : Math.max(1, totalCount))

  for (const item of extractable) {
    const segments = item.entryPath.split('/').filter(Boolean)
    const targetPath = path.resolve(resolvedRoot, ...segments)
    if (!targetPath.startsWith(resolvedRoot + path.sep)) {
      continue
    }

    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })
    await fs.promises.writeFile(targetPath, item.entry.getData())

    if (item.entryPath === 'local.db' || item.entryPath.startsWith('database/')) {
      dbPath = targetPath
    }

    processedBytes += item.size
    processedCount += 1
    if (totalBytes > 0) {
      onProgress?.(processedBytes, totalBytes)
    } else {
      onProgress?.(processedCount, Math.max(1, totalCount))
    }

    if (processedCount % 25 === 0) {
      await new Promise<void>((resolve) => setImmediate(resolve))
    }
  }

  return {
    dbPath,
    settingsDir: path.join(resolvedRoot, 'settings'),
    assetsDir: path.join(resolvedRoot, 'assets'),
    publicAssetsDir: path.join(resolvedRoot, 'public-assets'),
    gameSavesDir: path.join(resolvedRoot, 'game-saves'),
  }
}
