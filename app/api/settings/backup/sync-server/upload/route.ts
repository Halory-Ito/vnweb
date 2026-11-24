import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { normalizeBackupContentOptions } from '@/lib/backup-content'
import { collectSelectedBackupAssets, type BackupAssetFile } from '@/lib/server/backup-content'
import {
  readBackupContentConfig,
  readGameSaveBackupConfig as getGameSaveConfig,
  writeBackupContentConfig,
} from '@/lib/server/config-rw'
import { getDbPath } from '@/lib/server/database-config.mjs'
import { SYNC_BACKUP_META_FILENAME } from '@/lib/server/sync-backup-meta'
import { measurePathStats } from '@/lib/server/sync-backup-summary'
import { getEnabledSyncClient, getEnabledSyncConfig } from '@/lib/sync-client'
import { createTask, finishTask, getTask, updateTask } from '@/lib/webdav-progress'

import type { SyncClient } from '@/lib/sync-client/types'
import type { BackupContentOptions, RemoteBackupMeta } from '@/types'

const ASSET_UPLOAD_CONCURRENCY = 4

function collectUploadCategories(
  shouldUploadGameSaves: boolean,
  assetFiles: BackupAssetFile[],
): string[] {
  const categories = ['数据库']
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

// 启动上传任务
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

    const assetFiles = await collectSelectedBackupAssets(options)
    const dbSize = (await fs.promises.stat(dbPath)).size
    const gameSaveStats = shouldUploadGameSaves
      ? await measurePathStats(gameSaveDir)
      : { size: 0, fileCount: 0 }
    const assetsTotalSize = assetFiles.reduce((sum, file) => sum + file.size, 0)
    const totalSize = dbSize + gameSaveStats.size + assetsTotalSize
    const totalFiles = 1 + gameSaveStats.fileCount + assetFiles.length
    const categories = collectUploadCategories(shouldUploadGameSaves, assetFiles)

    const taskId = randomUUID()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const syncConfig = await getEnabledSyncConfig()
    const remoteRoot = (syncConfig?.remotePath || '/vnweb-backup').replace(/\/+$/g, '')
    const backupName = `vnweb-backup-${timestamp}`
    const backupDir = `${remoteRoot}/${backupName}`

    const task = createTask(taskId, totalSize, categories)
    task.message = '准备上传...'

    void runUpload({
      client,
      gameSaveDir: shouldUploadGameSaves ? gameSaveDir : null,
      gameSaveSize: gameSaveStats.size,
      assetFiles,
      assetsTotalSize,
      dbPath,
      dbSize,
      remoteRoot,
      backupName,
      backupDir,
      taskId,
      totalSize,
      totalFiles,
      categories,
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

async function uploadSelectedAssets(params: {
  client: SyncClient
  assetFiles: BackupAssetFile[]
  backupDir: string
  baseUploaded: number
  onProgress: (uploaded: number, currentCategory: string) => void
}) {
  const { client, assetFiles, backupDir, baseUploaded, onProgress } = params
  if (assetFiles.length === 0) return

  const dirSet = new Set<string>()
  for (const file of assetFiles) {
    const dir = path.posix.dirname(file.archivePath)
    if (!dir || dir === '.') continue
    let current = ''
    for (const segment of dir.split('/').filter(Boolean)) {
      current = current ? `${current}/${segment}` : segment
      dirSet.add(current)
    }
  }

  const dirs = [...dirSet].sort((a, b) => {
    const depthDiff = a.split('/').length - b.split('/').length
    return depthDiff !== 0 ? depthDiff : a.localeCompare(b)
  })
  for (const dir of dirs) {
    await client.createDirectory(`${backupDir}/${dir}`)
  }

  let nextIndex = 0
  let completedBytes = 0
  const inFlightLoaded = new Map<number, number>()
  const errors: Error[] = []

  const calcInFlight = () => {
    let total = 0
    for (const bytes of inFlightLoaded.values()) total += bytes
    return total
  }

  const worker = async () => {
    while (true) {
      const index = nextIndex++
      if (index >= assetFiles.length) break
      const file = assetFiles[index]!
      try {
        await client.uploadFile(file.localPath, `${backupDir}/${file.archivePath}`, (loaded) => {
          inFlightLoaded.set(index, loaded)
          onProgress(baseUploaded + completedBytes + calcInFlight(), file.categoryLabel)
        })
        inFlightLoaded.delete(index)
        completedBytes += file.size
        onProgress(baseUploaded + completedBytes + calcInFlight(), file.categoryLabel)
      } catch (error) {
        inFlightLoaded.delete(index)
        errors.push(error as Error)
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(ASSET_UPLOAD_CONCURRENCY, assetFiles.length) }, () => worker()),
  )
  if (errors.length > 0) throw errors[0]
}

async function runUpload(params: {
  client: SyncClient
  gameSaveDir: string | null
  gameSaveSize: number
  assetFiles: BackupAssetFile[]
  assetsTotalSize: number
  dbPath: string
  dbSize: number
  remoteRoot: string
  backupName: string
  backupDir: string
  taskId: string
  totalSize: number
  totalFiles: number
  categories: string[]
  options: BackupContentOptions
}) {
  const {
    client,
    gameSaveDir,
    gameSaveSize,
    assetFiles,
    assetsTotalSize,
    dbPath,
    dbSize,
    remoteRoot,
    backupName,
    backupDir,
    taskId,
    totalSize,
    totalFiles,
    categories,
    options,
  } = params

  try {
    const updateProgress = (uploaded: number, currentCategory: string) => {
      const clamped = Math.min(uploaded, totalSize)
      const percent = totalSize > 0 ? Math.min(100, Math.round((clamped / totalSize) * 100)) : 100
      updateTask(taskId, {
        uploaded: clamped,
        percent,
        currentCategory,
        currentFile: currentCategory,
        message: `正在上传：${currentCategory}（${percent}%）`,
      })
    }

    let uploaded = 0

    await client.createDirectory(backupDir)

    if (gameSaveDir) {
      await client.uploadDirectory(gameSaveDir, `${backupDir}/game-saves`, (loaded) => {
        updateProgress(uploaded + loaded, '游戏存档')
      })
      uploaded += gameSaveSize
    }

    if (assetFiles.length > 0) {
      await uploadSelectedAssets({
        client,
        assetFiles,
        backupDir,
        baseUploaded: uploaded,
        onProgress: updateProgress,
      })
      uploaded += assetsTotalSize
    }

    await client.uploadFile(dbPath, `${backupDir}/local.db`, (loaded) => {
      updateProgress(uploaded + loaded, '数据库')
    })
    uploaded += dbSize

    updateProgress(totalSize, '备份信息')
    const meta: RemoteBackupMeta = {
      version: 2,
      backupName,
      backupDate: new Date().toISOString(),
      totalSize,
      totalFiles,
      categories,
      options,
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
