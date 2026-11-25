import path from 'node:path'

import { BACKUP_IMAGE_KEYS, BACKUP_IMAGE_LABELS } from '@/lib/backup-content'
import {
  LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY,
  LIBRARY_FOLDER_LOGO_DIRECTORY,
} from '@/lib/library-folder-logo-path'
import { classifyAssetSubPath } from '@/lib/server/backup-content'
import { readGameSaveBackupConfig } from '@/lib/server/config-rw'
import { SYNC_BACKUP_ARCHIVE_FILENAME } from '@/lib/server/sync-backup-archive'

import type { SyncClient } from '@/lib/sync-client/types'
import type {
  BackupImageCategoryKey,
  BackupImageSubCategoryStat,
  RemoteBackupMeta,
  RemoteBackupStatus,
  RemoteDownloadCategorySummary,
  SyncDownloadPreviewSummary,
} from '@/types'

export const SYNC_BACKUP_META_FILENAME = 'backup-meta.json'

type ResolvedRemoteBackup = {
  backupName: string
  remoteBasePath: string
  backupDate: string
  meta: RemoteBackupMeta | null
}

function isSafeBackupName(name: string): boolean {
  return Boolean(name) && !name.includes('..') && !name.includes('/') && !name.includes('\\')
}

export function parseBackupDateFromDirName(name: string): string {
  const matched = /^vnweb-backup-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})$/.exec(name)
  if (!matched) return ''
  const parsed = new Date(`${matched[1]}T${matched[2]}:${matched[3]}:${matched[4]}Z`)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

export function parseRemoteBackupMeta(raw: Buffer | null): RemoteBackupMeta | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw.toString('utf-8')) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const record = parsed as Record<string, unknown>
    if (typeof record.backupDate !== 'string' || !record.backupDate.trim()) return null

    const categories = Array.isArray(record.categories)
      ? record.categories.filter((item): item is string => typeof item === 'string')
      : []

    const categorySummaries = Array.isArray(record.categorySummaries)
      ? (record.categorySummaries as RemoteDownloadCategorySummary[])
      : undefined
    const imageItems = Array.isArray(record.imageItems)
      ? (record.imageItems as BackupImageSubCategoryStat[])
      : undefined
    const archiveSize = Number(record.archiveSize)

    return {
      version: Number(record.version) || 1,
      backupName: typeof record.backupName === 'string' ? record.backupName.trim() : '',
      backupDate: record.backupDate.trim(),
      totalSize: Number(record.totalSize) || 0,
      totalFiles: Number(record.totalFiles) || 0,
      categories,
      options:
        record.options && typeof record.options === 'object' && !Array.isArray(record.options)
          ? (record.options as RemoteBackupMeta['options'])
          : undefined,
      archiveSize: Number.isFinite(archiveSize) && archiveSize > 0 ? archiveSize : undefined,
      archiveFile: typeof record.archiveFile === 'string' ? record.archiveFile.trim() : undefined,
      compressed: typeof record.compressed === 'boolean' ? record.compressed : undefined,
      categorySummaries,
      imageItems,
    }
  } catch {
    return null
  }
}

export async function resolveLatestRemoteBackup(
  client: SyncClient,
  remoteRoot: string,
): Promise<ResolvedRemoteBackup | null> {
  const normalizedRoot = remoteRoot.replace(/\/+$/g, '')
  const rootMetaRaw = await client
    .downloadBuffer(`${normalizedRoot}/${SYNC_BACKUP_META_FILENAME}`)
    .catch(() => null)
  const rootMeta = parseRemoteBackupMeta(rootMetaRaw)

  if (rootMeta && isSafeBackupName(rootMeta.backupName)) {
    const remoteBasePath = `${normalizedRoot}/${rootMeta.backupName}`
    const entries = await client.listDirectory(remoteBasePath).catch(() => [])
    if (entries.length > 0) {
      return {
        backupName: rootMeta.backupName,
        remoteBasePath,
        backupDate: rootMeta.backupDate,
        meta: rootMeta,
      }
    }
  }

  const backups = await client.listBackupDirectories()
  const sorted = [...backups].sort((a, b) => (a.name < b.name ? 1 : -1))
  const latest = sorted[0]
  if (!latest || !isSafeBackupName(latest.name)) {
    return null
  }

  const remoteBasePath = `${normalizedRoot}/${latest.name}`
  const dirMetaRaw = await client
    .downloadBuffer(`${remoteBasePath}/${SYNC_BACKUP_META_FILENAME}`)
    .catch(() => null)
  const dirMeta = parseRemoteBackupMeta(dirMetaRaw)
  const backupDate =
    dirMeta?.backupDate || parseBackupDateFromDirName(latest.name) || latest.lastmod || ''

  return {
    backupName: latest.name,
    remoteBasePath,
    backupDate,
    meta: dirMeta,
  }
}

export async function collectRemoteBackupStatus(
  client: SyncClient,
  remoteRoot: string,
): Promise<RemoteBackupStatus> {
  const resolved = await resolveLatestRemoteBackup(client, remoteRoot)
  if (!resolved) {
    return { exists: false }
  }

  return {
    exists: true,
    backupName: resolved.backupName,
    backupDate: resolved.backupDate,
    categories: resolved.meta?.categories,
    totalSize: resolved.meta?.totalSize,
    totalFiles: resolved.meta?.totalFiles,
  }
}

export async function collectRemoteDownloadPreview(
  client: SyncClient,
  remoteRoot: string,
): Promise<SyncDownloadPreviewSummary> {
  const [resolved, gameSaveConfig] = await Promise.all([
    resolveLatestRemoteBackup(client, remoteRoot),
    readGameSaveBackupConfig(),
  ])
  const gameSaveEnabled = Boolean(gameSaveConfig.enabled && gameSaveConfig.directory.trim())

  if (!resolved) {
    return {
      exists: false,
      backupName: '',
      backupDate: '',
      totalSize: 0,
      totalFiles: 0,
      categories: [],
      imageItems: [],
      gameSaveEnabled,
      hasGameSaves: false,
    }
  }

  if (
    resolved.meta?.compressed &&
    Array.isArray(resolved.meta.categorySummaries) &&
    resolved.meta.categorySummaries.length > 0
  ) {
    const categories = resolved.meta.categorySummaries.filter((category) => category.fileCount > 0)
    const imageItems = (resolved.meta.imageItems ?? []).filter((item) => item.fileCount > 0)
    const totalFiles = categories.reduce((sum, item) => sum + item.fileCount, 0)
    const totalSize = categories.reduce((sum, item) => sum + item.size, 0)

    return {
      exists: true,
      backupName: resolved.backupName,
      backupDate: resolved.backupDate,
      totalSize: totalSize || resolved.meta.totalSize,
      totalFiles: totalFiles || resolved.meta.totalFiles,
      archiveSize: resolved.meta.archiveSize,
      compressed: true,
      categories,
      imageItems,
      gameSaveEnabled,
      hasGameSaves: categories.some(
        (category) => category.key === 'game-saves' && category.fileCount > 0,
      ),
    }
  }

  const files = await client.listFilesRecursive(resolved.remoteBasePath)
  const archiveFile = files.find(
    (file) => file.relativePath.replace(/^\/+/, '') === SYNC_BACKUP_ARCHIVE_FILENAME,
  )
  const dbStat: RemoteDownloadCategorySummary = {
    key: 'database',
    label: '数据库',
    fileCount: 0,
    size: 0,
  }
  const settingsStat: RemoteDownloadCategorySummary = {
    key: 'settings',
    label: '设置文件',
    fileCount: 0,
    size: 0,
  }
  const saveStat: RemoteDownloadCategorySummary = {
    key: 'game-saves',
    label: '游戏存档',
    fileCount: 0,
    size: 0,
  }
  const videoStat: RemoteDownloadCategorySummary = {
    key: 'video',
    label: '视频',
    fileCount: 0,
    size: 0,
  }
  const audioStat: RemoteDownloadCategorySummary = {
    key: 'audio',
    label: '音频',
    fileCount: 0,
    size: 0,
  }
  const fontStat: RemoteDownloadCategorySummary = {
    key: 'font',
    label: '字体',
    fileCount: 0,
    size: 0,
  }

  const imageStats = {} as Record<BackupImageCategoryKey, { fileCount: number; size: number }>
  for (const key of BACKUP_IMAGE_KEYS) {
    imageStats[key] = { fileCount: 0, size: 0 }
  }

  for (const file of files) {
    const rel = file.relativePath.replace(/^\/+/, '')
    if (!rel || rel === SYNC_BACKUP_META_FILENAME) continue

    if (rel === 'local.db' || rel === 'database/local.db') {
      dbStat.fileCount += 1
      dbStat.size += file.size
      continue
    }

    if (rel.startsWith('settings/')) {
      settingsStat.fileCount += 1
      settingsStat.size += file.size
      continue
    }

    if (rel.startsWith('game-saves/')) {
      saveStat.fileCount += 1
      saveStat.size += file.size
      continue
    }

    if (
      rel.startsWith(`${LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY}/`) ||
      rel.startsWith(`${LIBRARY_FOLDER_LOGO_DIRECTORY}/`)
    ) {
      imageStats.brand.fileCount += 1
      imageStats.brand.size += file.size
      continue
    }

    if (rel.startsWith('assets/') || rel.startsWith('public-assets/')) {
      const subRelative = rel.startsWith('assets/')
        ? rel.slice('assets/'.length)
        : rel.slice('public-assets/'.length)
      const ext = path.posix.extname(subRelative).toLowerCase()
      const classified = classifyAssetSubPath(subRelative, ext)
      if (!classified) continue

      if (classified.type === 'image') {
        imageStats[classified.imageKey].fileCount += 1
        imageStats[classified.imageKey].size += file.size
      } else if (classified.type === 'video') {
        videoStat.fileCount += 1
        videoStat.size += file.size
      } else if (classified.type === 'audio') {
        audioStat.fileCount += 1
        audioStat.size += file.size
      } else {
        fontStat.fileCount += 1
        fontStat.size += file.size
      }
    }
  }

  const imageItems: BackupImageSubCategoryStat[] = BACKUP_IMAGE_KEYS.map((key) => ({
    key,
    label: BACKUP_IMAGE_LABELS[key],
    fileCount: imageStats[key].fileCount,
    size: imageStats[key].size,
  })).filter((item) => item.fileCount > 0)

  const imagesStat: RemoteDownloadCategorySummary = {
    key: 'images',
    label: '图片',
    fileCount: imageItems.reduce((sum, item) => sum + item.fileCount, 0),
    size: imageItems.reduce((sum, item) => sum + item.size, 0),
  }

  const categories = [
    dbStat,
    settingsStat,
    saveStat,
    imagesStat,
    videoStat,
    audioStat,
    fontStat,
  ].filter((category) => category.fileCount > 0)
  const totalFiles = categories.reduce((sum, item) => sum + item.fileCount, 0)
  const totalSize = categories.reduce((sum, item) => sum + item.size, 0)

  if (categories.length === 0 && archiveFile) {
    return {
      exists: true,
      backupName: resolved.backupName,
      backupDate: resolved.backupDate,
      totalSize: archiveFile.size,
      totalFiles: 1,
      archiveSize: archiveFile.size,
      compressed: true,
      categories: [
        {
          key: 'database',
          label: '备份压缩包',
          fileCount: 1,
          size: archiveFile.size,
        },
      ],
      imageItems: [],
      gameSaveEnabled,
      hasGameSaves: true,
    }
  }

  return {
    exists: true,
    backupName: resolved.backupName,
    backupDate: resolved.backupDate,
    totalSize,
    totalFiles,
    archiveSize: archiveFile?.size ?? resolved.meta?.archiveSize,
    compressed: Boolean(archiveFile || resolved.meta?.compressed),
    categories,
    imageItems,
    gameSaveEnabled,
    hasGameSaves: saveStat.fileCount > 0,
  }
}
