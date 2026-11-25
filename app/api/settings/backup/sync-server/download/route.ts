import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  isLibraryFolderLogoFilename,
  LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY,
  LIBRARY_FOLDER_LOGO_DIRECTORY,
} from '@/lib/library-folder-logo-path'
import {
  collectBackupSettingsFiles,
  isSafeBackupSettingsFileName,
  mergeBackupAssetDirectory,
  resolveBackupSettingsTargetPath,
  restoreBackupSettingsDirectory,
} from '@/lib/server/backup-content'
import { readGameSaveBackupConfig as getGameSaveConfig } from '@/lib/server/config-rw'
import { getDbPath } from '@/lib/server/database-config.mjs'
import {
  getLibraryFolderLogoDirectory,
  migrateLegacyLibraryLogoDirectory,
} from '@/lib/server/library-folder-logo-files'
import { getAssetsDir, getLegacyPublicAssetsDir, getTempDir } from '@/lib/server/runtime-paths.mjs'
import {
  extractSyncBackupArchive,
  inspectSyncBackupArchive,
  SYNC_BACKUP_ARCHIVE_FILENAME,
} from '@/lib/server/sync-backup-archive'
import {
  parseRemoteBackupMeta,
  resolveLatestRemoteBackup,
  SYNC_BACKUP_META_FILENAME,
} from '@/lib/server/sync-backup-meta'
import { getEnabledSyncClient, getEnabledSyncConfig } from '@/lib/sync-client'
import { createTask, finishTask, getTask, updateTask } from '@/lib/webdav-progress'

import type { SyncClient } from '@/lib/sync-client/types'

type RemoteDirectoryEntry = Awaited<ReturnType<SyncClient['listDirectory']>>[number]

type RemoteRestorePlan = {
  hasLocalDb: boolean
  hasSettings: boolean
  hasGameSaves: boolean
  hasAssets: boolean
  hasPublicAssets: boolean
  hasLegacyFolderLogos: boolean
  assetSubEntries: string[]
  publicAssetSubEntries: string[]
}

function getLocalBackupDir() {
  const documentsPath = path.join(os.homedir(), 'Documents')
  return path.join(documentsPath, 'VnBackups')
}

function isSafeEntryName(name: string) {
  return (
    Boolean(name) && name !== '.' && name !== '..' && !name.includes('/') && !name.includes('\\')
  )
}

async function listSafeSubEntries(client: SyncClient, remoteDir: string): Promise<string[]> {
  try {
    const entries = await client.listDirectory(remoteDir)
    return entries.map((entry) => entry.basename).filter(isSafeEntryName)
  } catch {
    return []
  }
}

async function buildLegacyRestorePlan(
  remoteBasePath: string,
  client: SyncClient,
  entries: RemoteDirectoryEntry[],
): Promise<RemoteRestorePlan> {
  const hasLocalDb = entries.some((entry) => entry.type === 'file' && entry.basename === 'local.db')
  const hasSettings = entries.some(
    (entry) => entry.type === 'directory' && entry.basename === 'settings',
  )
  const hasGameSaves = entries.some(
    (entry) => entry.type === 'directory' && entry.basename === 'game-saves',
  )
  const hasAssets = entries.some(
    (entry) => entry.type === 'directory' && entry.basename === 'assets',
  )
  const hasPublicAssets = entries.some(
    (entry) => entry.type === 'directory' && entry.basename === 'public-assets',
  )
  const hasLegacyFolderLogos = entries.some(
    (entry) =>
      entry.type === 'directory' && entry.basename === LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY,
  )

  const [assetSubEntries, publicAssetSubEntries] = await Promise.all([
    hasAssets ? listSafeSubEntries(client, `${remoteBasePath}/assets`) : Promise.resolve([]),
    hasPublicAssets
      ? listSafeSubEntries(client, `${remoteBasePath}/public-assets`)
      : Promise.resolve([]),
  ])

  return {
    hasLocalDb,
    hasSettings,
    hasGameSaves,
    hasAssets,
    hasPublicAssets,
    hasLegacyFolderLogos,
    assetSubEntries,
    publicAssetSubEntries,
  }
}

async function backupTargetedSubEntries(
  localRootDir: string,
  backupSubRootDir: string,
  subEntries: string[],
) {
  if (!fs.existsSync(localRootDir)) return
  for (const name of subEntries) {
    const srcPath = path.join(localRootDir, name)
    if (!fs.existsSync(srcPath)) continue
    const destPath = path.join(backupSubRootDir, name)
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
    await fs.promises.cp(srcPath, destPath, { recursive: true })
  }
}

// 仅备份本次将被覆盖的本地文件（下载前）
async function backupLocalFiles(timestamp: string, plan: RemoteRestorePlan) {
  const backupRoot = getLocalBackupDir()
  const backupDir = path.join(backupRoot, 'webdav-restore-before-' + timestamp)
  await fs.promises.mkdir(backupDir, { recursive: true })

  if (plan.hasGameSaves) {
    const gameSaveConfig = await getGameSaveConfig()
    if (gameSaveConfig.enabled && gameSaveConfig.directory) {
      const saveDir = gameSaveConfig.directory.trim()
      if (fs.existsSync(saveDir)) {
        await fs.promises.cp(saveDir, path.join(backupDir, 'game-saves'), { recursive: true })
      }
    }
  }

  if (plan.hasLocalDb) {
    const dbPath = getDbPath()
    if (fs.existsSync(dbPath)) {
      await fs.promises.copyFile(dbPath, path.join(backupDir, 'local.db'))
    }
  }

  if (plan.hasAssets) {
    await backupTargetedSubEntries(
      getAssetsDir(),
      path.join(backupDir, 'assets'),
      plan.assetSubEntries,
    )
  }

  if (plan.hasPublicAssets) {
    await backupTargetedSubEntries(
      getLegacyPublicAssetsDir(),
      path.join(backupDir, 'public-assets'),
      plan.publicAssetSubEntries,
    )
  }

  if (plan.hasLegacyFolderLogos) {
    const logoDir = getLibraryFolderLogoDirectory()
    if (fs.existsSync(logoDir)) {
      await fs.promises.cp(logoDir, path.join(backupDir, LIBRARY_FOLDER_LOGO_DIRECTORY), {
        recursive: true,
      })
    }
  }

  if (plan.hasSettings) {
    const settingsFiles = await collectBackupSettingsFiles()
    for (const file of settingsFiles) {
      const destPath = path.join(backupDir, ...file.archivePath.split('/'))
      await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
      await fs.promises.copyFile(file.localPath, destPath)
    }
  }

  return backupDir
}

async function restoreLegacyFilesWithProgress(params: {
  remoteBasePath: string
  client: SyncClient
  plan: RemoteRestorePlan
  taskId: string
  totalBytes: number
}) {
  const { remoteBasePath, client, plan, taskId, totalBytes } = params
  let completedBytes = 0

  const reportDownload = (inFlight: number, categoryLabel: string) => {
    const loaded =
      totalBytes > 0 ? Math.min(totalBytes, completedBytes + inFlight) : completedBytes + inFlight
    const ratio = totalBytes > 0 ? Math.min(1, loaded / totalBytes) : 0.5
    const percent = Math.min(95, 10 + Math.round(ratio * 85))
    updateTask(taskId, {
      stage: 'downloading',
      total: totalBytes,
      uploaded: loaded,
      transferred: loaded,
      percent,
      currentCategory: categoryLabel,
      currentFile: categoryLabel,
      message: `正在下载：${categoryLabel}（${percent}%）`,
    })
  }

  if (plan.hasAssets) {
    await client.downloadDirectory(
      `${remoteBasePath}/assets`,
      getAssetsDir(),
      (loaded, dirTotal) => {
        reportDownload(loaded, '图片与资源')
        if (dirTotal > 0 && loaded >= dirTotal) {
          completedBytes += dirTotal
        }
      },
    )
    await migrateLegacyLibraryLogoDirectory()
  }

  if (plan.hasPublicAssets) {
    await client.downloadDirectory(
      `${remoteBasePath}/public-assets`,
      getLegacyPublicAssetsDir(),
      (loaded, dirTotal) => {
        reportDownload(loaded, '公共资源')
        if (dirTotal > 0 && loaded >= dirTotal) {
          completedBytes += dirTotal
        }
      },
    )
  }

  if (plan.hasLegacyFolderLogos) {
    const remoteLogoDir = `${remoteBasePath}/${LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY}`
    const localLogoDir = getLibraryFolderLogoDirectory()
    for (const file of await client.listDirectory(remoteLogoDir)) {
      if (file.type === 'file' && isLibraryFolderLogoFilename(file.basename)) {
        await client.downloadFile(
          `${remoteLogoDir}/${file.basename}`,
          path.join(localLogoDir, file.basename),
          (loaded) => reportDownload(loaded, '品牌图标'),
        )
        completedBytes += file.size
        reportDownload(0, '品牌图标')
      }
    }
  }

  if (plan.hasGameSaves) {
    const gameSaveConfig = await getGameSaveConfig()
    if (gameSaveConfig.enabled && gameSaveConfig.directory) {
      const saveDir = gameSaveConfig.directory.trim()
      if (saveDir) {
        await client.downloadDirectory(
          `${remoteBasePath}/game-saves`,
          saveDir,
          (loaded, dirTotal) => {
            reportDownload(loaded, '游戏存档')
            if (dirTotal > 0 && loaded >= dirTotal) {
              completedBytes += dirTotal
            }
          },
        )
      }
    }
  }

  if (plan.hasLocalDb) {
    const dbPath = getDbPath()
    await fs.promises.mkdir(path.dirname(dbPath), { recursive: true })
    let dbBytes = 0
    await client.downloadFile(`${remoteBasePath}/local.db`, dbPath, (loaded, fileTotal) => {
      dbBytes = fileTotal > 0 ? fileTotal : loaded
      reportDownload(loaded, '数据库')
    })
    completedBytes += dbBytes
    reportDownload(0, '数据库')
  }

  if (plan.hasSettings) {
    const remoteSettingsDir = `${remoteBasePath}/settings`
    for (const file of await client.listDirectory(remoteSettingsDir)) {
      if (file.type === 'file' && isSafeBackupSettingsFileName(file.basename)) {
        const destPath = resolveBackupSettingsTargetPath(file.basename)
        await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
        await client.downloadFile(`${remoteSettingsDir}/${file.basename}`, destPath, (loaded) => {
          reportDownload(loaded, '设置文件')
        })
        completedBytes += file.size
        reportDownload(0, '设置文件')
      }
    }
  }
}

async function runCompressedRestore(params: {
  client: SyncClient
  remoteBasePath: string
  remoteArchiveSize: number
  taskId: string
  timestamp: string
}) {
  const { client, remoteBasePath, remoteArchiveSize, taskId, timestamp } = params
  const workDir = path.join(getTempDir(), `sync-download-${taskId}`)
  const localZipPath = path.join(workDir, SYNC_BACKUP_ARCHIVE_FILENAME)
  const extractDir = path.join(workDir, 'extracted')

  try {
    let knownArchiveSize = remoteArchiveSize

    await client.downloadFile(
      `${remoteBasePath}/${SYNC_BACKUP_ARCHIVE_FILENAME}`,
      localZipPath,
      (loaded, streamTotal) => {
        const resolvedTotal = streamTotal > 0 ? streamTotal : knownArchiveSize
        if (resolvedTotal > 0) {
          knownArchiveSize = resolvedTotal
        }
        const ratio = resolvedTotal > 0 ? Math.min(1, loaded / resolvedTotal) : 0
        const percent = Math.min(65, Math.round(ratio * 65))
        updateTask(taskId, {
          stage: 'downloading',
          total: resolvedTotal,
          uploaded: loaded,
          transferred: loaded,
          archiveSize: resolvedTotal,
          percent,
          currentCategory: '压缩包',
          currentFile: SYNC_BACKUP_ARCHIVE_FILENAME,
          message: `正在下载压缩包（${percent}%）`,
        })
      },
    )

    if (knownArchiveSize <= 0 && fs.existsSync(localZipPath)) {
      knownArchiveSize = (await fs.promises.stat(localZipPath)).size
    }

    updateTask(taskId, {
      stage: 'backing-up',
      total: knownArchiveSize,
      uploaded: knownArchiveSize,
      transferred: knownArchiveSize,
      percent: 68,
      currentCategory: '本地备份',
      currentFile: '本地备份',
      message: '正在备份将被覆盖的本地文件...',
    })

    const inspected = await inspectSyncBackupArchive(localZipPath)
    const plan: RemoteRestorePlan = {
      hasLocalDb: inspected.hasLocalDb,
      hasSettings: inspected.hasSettings,
      hasGameSaves: inspected.hasGameSaves,
      hasAssets: inspected.hasAssets,
      hasPublicAssets: inspected.hasPublicAssets,
      hasLegacyFolderLogos: false,
      assetSubEntries: inspected.assetSubEntries,
      publicAssetSubEntries: inspected.publicAssetSubEntries,
    }
    const backupDir = await backupLocalFiles(timestamp, plan)
    updateTask(taskId, { backupDir })

    const extracted = await extractSyncBackupArchive(
      localZipPath,
      extractDir,
      (processed, total) => {
        const ratio = total > 0 ? Math.min(1, processed / total) : 1
        const percent = Math.min(90, 72 + Math.round(ratio * 18))
        updateTask(taskId, {
          stage: 'extracting',
          percent,
          currentCategory: '解压文件',
          currentFile: '解压文件',
          message: `正在解压备份文件（${percent}%）`,
        })
      },
    )

    updateTask(taskId, {
      stage: 'restoring',
      percent: 92,
      currentCategory: '恢复数据',
      currentFile: '恢复数据',
      message: '正在恢复数据库、资源与设置（92%）...',
    })

    if (plan.hasAssets) {
      await mergeBackupAssetDirectory(extracted.assetsDir, getAssetsDir())
      await migrateLegacyLibraryLogoDirectory()
    }
    if (plan.hasPublicAssets) {
      await mergeBackupAssetDirectory(extracted.publicAssetsDir, getLegacyPublicAssetsDir())
    }
    if (plan.hasGameSaves && fs.existsSync(extracted.gameSavesDir)) {
      const gameSaveConfig = await getGameSaveConfig()
      if (gameSaveConfig.enabled && gameSaveConfig.directory) {
        const saveDir = gameSaveConfig.directory.trim()
        if (saveDir) {
          await fs.promises.mkdir(saveDir, { recursive: true })
          await fs.promises.cp(extracted.gameSavesDir, saveDir, { recursive: true, force: true })
        }
      }
    }
    if (plan.hasLocalDb && extracted.dbPath && fs.existsSync(extracted.dbPath)) {
      const dbPath = getDbPath()
      await fs.promises.mkdir(path.dirname(dbPath), { recursive: true })
      await fs.promises.copyFile(extracted.dbPath, dbPath)
    }
    if (plan.hasSettings) {
      await restoreBackupSettingsDirectory(extracted.settingsDir)
    }

    updateTask(taskId, {
      total: knownArchiveSize,
      uploaded: knownArchiveSize,
      transferred: knownArchiveSize,
      backupDir,
    })
    finishTask(taskId, 'success', '下载成功，本地文件已备份，页面将重新加载')
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function runDownload(params: {
  client: SyncClient
  remoteBasePath: string
  remoteEntries: RemoteDirectoryEntry[]
  remoteArchiveSize: number | null
  taskId: string
}) {
  const { client, remoteBasePath, remoteEntries, remoteArchiveSize, taskId } = params
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

  try {
    if (remoteArchiveSize !== null) {
      await runCompressedRestore({
        client,
        remoteBasePath,
        remoteArchiveSize,
        taskId,
        timestamp,
      })
      return
    }

    updateTask(taskId, {
      stage: 'backing-up',
      percent: 5,
      currentCategory: '本地备份',
      currentFile: '本地备份',
      message: '正在检查并备份本地文件...',
    })

    const plan = await buildLegacyRestorePlan(remoteBasePath, client, remoteEntries)
    const backupDir = await backupLocalFiles(timestamp, plan)
    updateTask(taskId, { backupDir })

    const files = await client.listFilesRecursive(remoteBasePath)
    const totalBytes = files
      .filter((file) => file.relativePath.replace(/^\/+/, '') !== SYNC_BACKUP_META_FILENAME)
      .reduce((sum, file) => sum + file.size, 0)

    updateTask(taskId, {
      stage: 'downloading',
      total: totalBytes,
      uploaded: 0,
      transferred: 0,
      percent: 10,
      message: '正在下载远端文件（10%）',
    })

    await restoreLegacyFilesWithProgress({
      remoteBasePath,
      client,
      plan,
      taskId,
      totalBytes,
    })

    updateTask(taskId, {
      stage: 'restoring',
      total: totalBytes,
      uploaded: totalBytes,
      transferred: totalBytes,
      percent: 98,
      currentCategory: '恢复完成',
      message: '正在完成恢复...',
    })

    finishTask(taskId, 'success', '下载成功，本地文件已备份，页面将重新加载')
  } catch (error) {
    console.error('WebDAV download failed:', error)
    finishTask(taskId, 'error', '下载失败', (error as Error).message)
  }
}

// 启动远端拉取与恢复任务
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { backupName?: unknown }
    const requestedBackupName = typeof body?.backupName === 'string' ? body.backupName.trim() : ''

    if (
      requestedBackupName &&
      (requestedBackupName.includes('..') ||
        requestedBackupName.includes('/') ||
        requestedBackupName.includes('\\'))
    ) {
      return NextResponse.json({ error: '无效的备份名称' }, { status: 400 })
    }

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

    const syncConfig = await getEnabledSyncConfig()
    const remoteRoot = (syncConfig?.remotePath || '/vnweb-backup').replace(/\/+$/g, '')
    let backupName = requestedBackupName
    if (!backupName) {
      const latest = await resolveLatestRemoteBackup(client, remoteRoot)
      if (!latest) {
        return NextResponse.json({ error: '远端暂无可拉取的备份' }, { status: 404 })
      }
      backupName = latest.backupName
    }

    const remoteBasePath = `${remoteRoot}/${backupName}`
    const remoteEntries = await client.listDirectory(remoteBasePath)
    if (remoteEntries.length === 0) {
      return NextResponse.json({ error: '远端备份目录不存在或为空' }, { status: 404 })
    }

    const metaRaw = await client
      .downloadBuffer(`${remoteBasePath}/${SYNC_BACKUP_META_FILENAME}`)
      .catch(() => null)
    const meta = parseRemoteBackupMeta(metaRaw)
    const archiveEntry = remoteEntries.find(
      (entry) => entry.type === 'file' && entry.basename === SYNC_BACKUP_ARCHIVE_FILENAME,
    )
    const remoteArchiveSize = archiveEntry ? archiveEntry.size || meta?.archiveSize || 0 : null

    const taskId = randomUUID()
    const task = createTask(taskId, remoteArchiveSize ?? 0, meta?.categories ?? [])
    task.type = 'download'
    task.stage = 'preparing'
    task.transferred = 0
    if (remoteArchiveSize) {
      task.archiveSize = remoteArchiveSize
    }
    task.message = '准备拉取远端备份...'

    void runDownload({
      client,
      remoteBasePath,
      remoteEntries,
      remoteArchiveSize,
      taskId,
    })

    return NextResponse.json({
      data: {
        taskId,
        backupName,
      },
    })
  } catch (error) {
    console.error('WebDAV download start failed:', error)
    return NextResponse.json({ error: (error as Error).message || '启动下载失败' }, { status: 500 })
  }
}

// 查询下载恢复进度
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
