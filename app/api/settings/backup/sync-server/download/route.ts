import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  isLibraryFolderLogoFilename,
  LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY,
  LIBRARY_FOLDER_LOGO_DIRECTORY,
} from '@/lib/library-folder-logo-path'
import { readGameSaveBackupConfig as getGameSaveConfig } from '@/lib/server/config-rw'
import { getDbPath } from '@/lib/server/database-config.mjs'
import {
  getLibraryFolderLogoDirectory,
  migrateLegacyLibraryLogoDirectory,
} from '@/lib/server/library-folder-logo-files'
import { resolveLatestRemoteBackup } from '@/lib/server/sync-backup-meta'
import { getEnabledSyncClient, getEnabledSyncConfig } from '@/lib/sync-client'

import type { SyncClient } from '@/lib/sync-client/types'

type RemoteRestorePlan = {
  hasLocalDb: boolean
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

async function buildRestorePlan(
  remoteBasePath: string,
  client: SyncClient,
): Promise<RemoteRestorePlan> {
  const entries = await client.listDirectory(remoteBasePath)
  const hasLocalDb = entries.some((entry) => entry.type === 'file' && entry.basename === 'local.db')
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
      path.join(process.cwd(), 'assets'),
      path.join(backupDir, 'assets'),
      plan.assetSubEntries,
    )
  }

  if (plan.hasPublicAssets) {
    await backupTargetedSubEntries(
      path.join(process.cwd(), 'public', 'assets'),
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

  return backupDir
}

// 合并覆盖本地文件
async function restoreLocalFiles(
  remoteBasePath: string,
  client: SyncClient,
  plan: RemoteRestorePlan,
) {
  if (plan.hasAssets) {
    await client.downloadDirectory(`${remoteBasePath}/assets`, path.join(process.cwd(), 'assets'))
    await migrateLegacyLibraryLogoDirectory()
  }

  if (plan.hasPublicAssets) {
    await client.downloadDirectory(
      `${remoteBasePath}/public-assets`,
      path.join(process.cwd(), 'public', 'assets'),
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
        )
      }
    }
  }

  if (plan.hasGameSaves) {
    const gameSaveConfig = await getGameSaveConfig()
    if (gameSaveConfig.enabled && gameSaveConfig.directory) {
      const saveDir = gameSaveConfig.directory.trim()
      if (saveDir) {
        await client.downloadDirectory(`${remoteBasePath}/game-saves`, saveDir)
      }
    }
  }

  if (plan.hasLocalDb) {
    const dbPath = getDbPath()
    await client.downloadFile(`${remoteBasePath}/local.db`, dbPath)
  }
}

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

    const plan = await buildRestorePlan(remoteBasePath, client)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupDir = await backupLocalFiles(timestamp, plan)

    await restoreLocalFiles(remoteBasePath, client, plan)

    return NextResponse.json({
      data: {
        success: true,
        message: '下载成功，本地文件已备份',
        backupDir,
      },
    })
  } catch (error) {
    console.error('WebDAV download failed:', error)
    return NextResponse.json({ error: (error as Error).message || '下载失败' }, { status: 500 })
  }
}
