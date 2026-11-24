import fs from 'node:fs'
import path from 'node:path'

import { BACKUP_IMAGE_KEYS, BACKUP_IMAGE_LABELS } from '@/lib/backup-content'
import { scanAllBackupAssets } from '@/lib/server/backup-content'
import { readBackupContentConfig, readGameSaveBackupConfig } from '@/lib/server/config-rw'
import { getDbPath } from '@/lib/server/database-config.mjs'

import type { BackupImageSubCategoryStat, SyncUploadPreviewSummary } from '@/types'

export async function measurePathStats(
  target: string,
): Promise<{ size: number; fileCount: number }> {
  const stat = await fs.promises.stat(target)
  if (stat.isFile()) {
    return { size: stat.size, fileCount: 1 }
  }
  if (!stat.isDirectory()) {
    return { size: 0, fileCount: 0 }
  }

  let size = 0
  let fileCount = 0
  const entries = await fs.promises.readdir(target, { withFileTypes: true })
  for (const entry of entries) {
    const child = await measurePathStats(path.join(target, entry.name))
    size += child.size
    fileCount += child.fileCount
  }
  return { size, fileCount }
}

async function resolveDatabaseStat(): Promise<SyncUploadPreviewSummary['database']> {
  const dbPath = getDbPath()
  if (!fs.existsSync(dbPath)) {
    return {
      label: '数据库',
      fileCount: 0,
      size: 0,
      available: false,
      unavailableReason: '数据库文件不存在',
    }
  }
  try {
    const stats = await measurePathStats(dbPath)
    return {
      label: '数据库',
      fileCount: stats.fileCount,
      size: stats.size,
      available: true,
    }
  } catch {
    return {
      label: '数据库',
      fileCount: 0,
      size: 0,
      available: false,
      unavailableReason: '无法读取数据库文件',
    }
  }
}

async function resolveGameSaveStat(config: {
  enabled: boolean
  directory: string
}): Promise<SyncUploadPreviewSummary['gameSaves']> {
  if (!config.enabled) {
    return {
      label: '游戏存档',
      fileCount: 0,
      size: 0,
      status: 'disabled',
      unavailableReason: '未启用游戏存档备份',
    }
  }

  const dir = config.directory.trim()
  if (!dir) {
    return {
      label: '游戏存档',
      fileCount: 0,
      size: 0,
      status: 'missing',
      unavailableReason: '未配置存档目录',
    }
  }

  if (!fs.existsSync(dir)) {
    return {
      label: '游戏存档',
      fileCount: 0,
      size: 0,
      status: 'missing',
      unavailableReason: '存档目录不存在',
    }
  }

  try {
    const stats = await measurePathStats(dir)
    return {
      label: '游戏存档',
      fileCount: stats.fileCount,
      size: stats.size,
      status: 'available',
    }
  } catch {
    return {
      label: '游戏存档',
      fileCount: 0,
      size: 0,
      status: 'missing',
      unavailableReason: '无法读取游戏存档目录',
    }
  }
}

export async function collectSyncUploadSummary(): Promise<SyncUploadPreviewSummary> {
  const [options, gameSaveConfig, scannedAssets, database] = await Promise.all([
    readBackupContentConfig(),
    readGameSaveBackupConfig(),
    scanAllBackupAssets(),
    resolveDatabaseStat(),
  ])

  const gameSaves = await resolveGameSaveStat(gameSaveConfig)

  const imageItems: BackupImageSubCategoryStat[] = BACKUP_IMAGE_KEYS.map((key) => {
    const bucket = scannedAssets.images[key]
    return {
      key,
      label: BACKUP_IMAGE_LABELS[key],
      fileCount: bucket.files.length,
      size: bucket.size,
    }
  })

  const totalImageFiles = imageItems.reduce((sum, item) => sum + item.fileCount, 0)
  const totalImageSize = imageItems.reduce((sum, item) => sum + item.size, 0)

  return {
    options,
    database,
    gameSaves,
    images: {
      label: '图片',
      totalFileCount: totalImageFiles,
      totalSize: totalImageSize,
      items: imageItems,
    },
    video: {
      label: '视频',
      fileCount: scannedAssets.video.files.length,
      size: scannedAssets.video.size,
    },
    audio: {
      label: '音频',
      fileCount: scannedAssets.audio.files.length,
      size: scannedAssets.audio.size,
    },
    font: {
      label: '字体',
      fileCount: scannedAssets.font.files.length,
      size: scannedAssets.font.size,
    },
  }
}
