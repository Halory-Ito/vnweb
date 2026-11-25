import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import {
  BACKUP_IMAGE_KEYS,
  BACKUP_IMAGE_LABELS,
  normalizeBackupContentOptions,
} from '@/lib/backup-content'
import {
  collectBackupSettingsFiles,
  collectSelectedBackupAssets,
  scanAllBackupAssets,
  type BackupAssetFile,
} from '@/lib/server/backup-content'
import {
  readBackupContentConfig,
  readGameSaveBackupConfig as getGameSaveConfig,
  writeBackupContentConfig,
} from '@/lib/server/config-rw'
import { getDbPath } from '@/lib/server/database-config.mjs'
import { getTempDir } from '@/lib/server/runtime-paths.mjs'
import {
  createSyncBackupArchive,
  SYNC_BACKUP_ARCHIVE_FILENAME,
} from '@/lib/server/sync-backup-archive'
import { SYNC_BACKUP_META_FILENAME } from '@/lib/server/sync-backup-meta'
import { measurePathStats } from '@/lib/server/sync-backup-summary'
import { getEnabledSyncClient, getEnabledSyncConfig } from '@/lib/sync-client'
import { createTask, finishTask, getTask, updateTask } from '@/lib/webdav-progress'

import type { SyncClient } from '@/lib/sync-client/types'
import type {
  BackupContentOptions,
  BackupImageSubCategoryStat,
  RemoteBackupMeta,
  RemoteDownloadCategorySummary,
} from '@/types'

function collectUploadCategories(
  hasSettings: boolean,
  shouldUploadGameSaves: boolean,
  assetFiles: BackupAssetFile[],
): string[] {
  const categories = ['数据库']
  if (hasSettings) {
    categories.push('设置文件')
  }
  if (shouldUploadGameSaves) {
    categories.push('游戏存档')
  }
  if (assetFiles.some((file) => file.categoryLabel.startsWith('图片'))) {
    categories.push('图片')
  }
  if (assetFiles.some((file) => file.categoryLabel === '视频')) {
    categories.push('视频')
  }
  if (assetFiles.some((file) => file.categoryLabel === '音频')) {
    categories.push('音频')
  }
  if (assetFiles.some((file) => file.categoryLabel === '字体')) {
    categories.push('字体')
  }
  return categories
}

// 启动压缩与上传任务
export async function POST(req: NextRequest) {
  try {
    const client = await getEnabledSyncClient()
    if (!client) {
      return NextResponse.json(
        { error: '同步服务器配置未设置，请先在设置中配置同步服务器' },
        { status: 400 },
      )
    }

    const connected = await client.testConnection()
    if (!connected) {
      return NextResponse.json({ error: '无法连接到同步服务器，请检查配置' }, { status: 400 })
    }

    const body = (await req.json().catch(() => null)) as {
      options?: unknown
      saveOptions?: boolean
    } | null
    const hasCustomOptions = Boolean(
      body && typeof body === 'object' && 'options' in body && body.options !== undefined,
    )
    const options = hasCustomOptions
      ? normalizeBackupContentOptions(body?.options)
      : await readBackupContentConfig()
    if (hasCustomOptions && body?.saveOptions !== false) {
      await writeBackupContentConfig(options)
    }

    const dbPath = getDbPath()
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: '数据库文件不存在，无法上传' }, { status: 400 })
    }

    const gameSaveConfig = await getGameSaveConfig()
    const gameSaveDir =
      gameSaveConfig.enabled && gameSaveConfig.directory ? gameSaveConfig.directory.trim() : ''
    if (
      options.gameSaves &&
      gameSaveConfig.enabled &&
      (!gameSaveDir || !fs.existsSync(gameSaveDir))
    ) {
      return NextResponse.json(
        { error: '游戏存档目录未设置或不存在，请先在设置中配置游戏存档或取消勾选游戏存档' },
        { status: 400 },
      )
    }
    const shouldUploadGameSaves = Boolean(
      options.gameSaves && gameSaveConfig.enabled && gameSaveDir && fs.existsSync(gameSaveDir),
    )

    const [scannedAssets, settingsFiles] = await Promise.all([
      scanAllBackupAssets(),
      collectBackupSettingsFiles(),
    ])
    const assetFiles = await collectSelectedBackupAssets(options, scannedAssets)

    const dbSize = (await fs.promises.stat(dbPath)).size
    const gameSaveStats = shouldUploadGameSaves
      ? await measurePathStats(gameSaveDir)
      : { size: 0, fileCount: 0 }
    const assetsTotalSize = assetFiles.reduce((sum, file) => sum + file.size, 0)
    const settingsTotalSize = settingsFiles.reduce((sum, file) => sum + file.size, 0)
    const totalSize = dbSize + settingsTotalSize + gameSaveStats.size + assetsTotalSize
    const totalFiles = 1 + settingsFiles.length + gameSaveStats.fileCount + assetFiles.length
    const categories = collectUploadCategories(
      settingsFiles.length > 0,
      shouldUploadGameSaves,
      assetFiles,
    )

    const imageItems: BackupImageSubCategoryStat[] = BACKUP_IMAGE_KEYS.filter(
      (key) => options.images[key] && scannedAssets.images[key].files.length > 0,
    ).map((key) => ({
      key,
      label: BACKUP_IMAGE_LABELS[key],
      fileCount: scannedAssets.images[key].files.length,
      size: scannedAssets.images[key].size,
    }))

    const selectedImageFiles = imageItems.reduce((sum, item) => sum + item.fileCount, 0)
    const selectedImageSize = imageItems.reduce((sum, item) => sum + item.size, 0)

    const categorySummaries: RemoteDownloadCategorySummary[] = [
      { key: 'database' as const, label: '数据库', fileCount: 1, size: dbSize },
      {
        key: 'settings' as const,
        label: '设置文件',
        fileCount: settingsFiles.length,
        size: settingsTotalSize,
      },
      {
        key: 'game-saves' as const,
        label: '游戏存档',
        fileCount: gameSaveStats.fileCount,
        size: gameSaveStats.size,
      },
      {
        key: 'images' as const,
        label: '图片',
        fileCount: selectedImageFiles,
        size: selectedImageSize,
      },
      {
        key: 'video' as const,
        label: '视频',
        fileCount: options.video ? scannedAssets.video.files.length : 0,
        size: options.video ? scannedAssets.video.size : 0,
      },
      {
        key: 'audio' as const,
        label: '音频',
        fileCount: options.audio ? scannedAssets.audio.files.length : 0,
        size: options.audio ? scannedAssets.audio.size : 0,
      },
      {
        key: 'font' as const,
        label: '字体',
        fileCount: options.font ? scannedAssets.font.files.length : 0,
        size: options.font ? scannedAssets.font.size : 0,
      },
    ].filter((category) => category.fileCount > 0)

    const taskId = randomUUID()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const syncConfig = await getEnabledSyncConfig()
    const remoteRoot = (syncConfig?.remotePath || '/vnweb-backup').replace(/\/+$/g, '')
    const backupName = `vnweb-backup-${timestamp}`
    const backupDir = `${remoteRoot}/${backupName}`

    const task = createTask(taskId, totalSize, categories)
    task.type = 'upload'
    task.stage = 'compressing'
    task.uncompressedSize = totalSize
    task.transferred = 0
    task.currentCategory = '压缩打包'
    task.message = '正在打包压缩...'

    void runUpload({
      client,
      gameSaveDir: shouldUploadGameSaves ? gameSaveDir : null,
      assetFiles,
      settingsFiles,
      dbPath,
      remoteRoot,
      backupName,
      backupDir,
      taskId,
      totalSize,
      totalFiles,
      categories,
      categorySummaries,
      imageItems,
      options,
    })

    return NextResponse.json({
      data: {
        taskId,
        backupDir,
        totalSize,
      },
    })
  } catch (error) {
    console.error('WebDAV upload start failed:', error)
    return NextResponse.json({ error: (error as Error).message || '启动上传失败' }, { status: 500 })
  }
}

async function runUpload(params: {
  client: SyncClient
  gameSaveDir: string | null
  assetFiles: BackupAssetFile[]
  settingsFiles: BackupAssetFile[]
  dbPath: string
  remoteRoot: string
  backupName: string
  backupDir: string
  taskId: string
  totalSize: number
  totalFiles: number
  categories: string[]
  categorySummaries: RemoteDownloadCategorySummary[]
  imageItems: BackupImageSubCategoryStat[]
  options: BackupContentOptions
}) {
  const {
    client,
    gameSaveDir,
    assetFiles,
    settingsFiles,
    dbPath,
    remoteRoot,
    backupName,
    backupDir,
    taskId,
    totalSize,
    totalFiles,
    categories,
    categorySummaries,
    imageItems,
    options,
  } = params

  const workDir = path.join(getTempDir(), `sync-upload-${taskId}`)
  const archivePath = path.join(workDir, SYNC_BACKUP_ARCHIVE_FILENAME)

  try {
    const { archiveSize } = await createSyncBackupArchive({
      dbPath,
      assetFiles,
      settingsFiles,
      gameSaveDir,
      options,
      outputPath: archivePath,
      uncompressedTotalSize: totalSize,
      onProgress: (processed, uncompressedTotal) => {
        const ratio = uncompressedTotal > 0 ? Math.min(1, processed / uncompressedTotal) : 1
        const percent = Math.min(35, Math.round(ratio * 35))
        updateTask(taskId, {
          stage: 'compressing',
          uploaded: Math.min(processed, totalSize),
          percent,
          currentCategory: '压缩打包',
          currentFile: '压缩打包',
          message: `正在打包压缩（${percent}%）`,
        })
      },
    })

    updateTask(taskId, {
      stage: 'uploading',
      total: archiveSize,
      uploaded: 0,
      transferred: 0,
      archiveSize,
      percent: 35,
      currentCategory: '压缩包',
      currentFile: SYNC_BACKUP_ARCHIVE_FILENAME,
      message: '正在上传压缩包（35%）',
    })

    await client.createDirectory(backupDir)
    await client.uploadFile(
      archivePath,
      `${backupDir}/${SYNC_BACKUP_ARCHIVE_FILENAME}`,
      (loaded) => {
        const clamped = Math.min(loaded, archiveSize)
        const ratio = archiveSize > 0 ? Math.min(1, clamped / archiveSize) : 1
        const percent = Math.min(95, 35 + Math.round(ratio * 60))
        updateTask(taskId, {
          stage: 'uploading',
          total: archiveSize,
          uploaded: clamped,
          transferred: clamped,
          percent,
          currentCategory: '压缩包',
          currentFile: SYNC_BACKUP_ARCHIVE_FILENAME,
          message: `正在上传压缩包（${percent}%）`,
        })
      },
    )

    updateTask(taskId, {
      stage: 'finalizing',
      uploaded: archiveSize,
      transferred: archiveSize,
      percent: 96,
      currentCategory: '备份信息',
      currentFile: SYNC_BACKUP_META_FILENAME,
      message: '正在写入备份元信息...',
    })

    const meta: RemoteBackupMeta = {
      version: 3,
      backupName,
      backupDate: new Date().toISOString(),
      totalSize,
      totalFiles,
      categories,
      options,
      archiveSize,
      archiveFile: SYNC_BACKUP_ARCHIVE_FILENAME,
      compressed: true,
      categorySummaries,
      imageItems,
    }
    const metaContent = JSON.stringify(meta, null, 2)
    await client.uploadBuffer(
      metaContent,
      `${backupDir}/${SYNC_BACKUP_META_FILENAME}`,
      'application/json',
    )
    await client.uploadBuffer(
      metaContent,
      `${remoteRoot}/${SYNC_BACKUP_META_FILENAME}`,
      'application/json',
    )

    finishTask(taskId, 'success', '上传完成')
  } catch (error) {
    console.error('WebDAV upload failed:', error)
    finishTask(taskId, 'error', '上传失败', (error as Error).message)
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

// 查询上传进度
export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId) {
    return NextResponse.json({ error: '缺少 taskId' }, { status: 400 })
  }

  const task = getTask(taskId)
  if (!task) {
    return NextResponse.json({ error: '任务不存在或已过期' }, { status: 404 })
  }

  return NextResponse.json({ data: task })
}
