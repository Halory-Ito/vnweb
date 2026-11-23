import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  isLibraryFolderLogoFilename,
  LIBRARY_FOLDER_LOGO_DIRECTORY,
} from '@/lib/library-folder-logo-path'
import { readGameSaveBackupConfig as getGameSaveConfig } from '@/lib/server/config-rw'
import { getDbPath } from '@/lib/server/database-config.mjs'
import { getLibraryFolderLogoDirectory } from '@/lib/server/library-folder-logo-files'
import { getEnabledSyncClient, getEnabledSyncConfig } from '@/lib/sync-client'

import type { SyncClient } from '@/lib/sync-client/types'

// 获取本地备份根目录
function getLocalBackupDir() {
  const documentsPath = path.join(os.homedir(), 'Documents')
  return path.join(documentsPath, 'VnBackups')
}

// 备份本地文件（下载前）：游戏存档目录 + local.db
async function backupLocalFiles(timestamp: string) {
  const backupRoot = getLocalBackupDir()
  const backupDir = path.join(backupRoot, 'webdav-restore-before-' + timestamp)
  await fs.promises.mkdir(backupDir, { recursive: true })

  // 备份游戏存档目录
  const gameSaveConfig = await getGameSaveConfig()
  if (gameSaveConfig.enabled && gameSaveConfig.directory) {
    const saveDir = gameSaveConfig.directory.trim()
    if (fs.existsSync(saveDir)) {
      const backupSavePath = path.join(backupDir, 'game-saves')
      await fs.promises.cp(saveDir, backupSavePath, { recursive: true })
    }
  }

  // 备份local.db文件
  const dbPath = getDbPath()
  if (fs.existsSync(dbPath)) {
    const backupDbPath = path.join(backupDir, 'local.db')
    await fs.promises.copyFile(dbPath, backupDbPath)
  }

  const logoDir = getLibraryFolderLogoDirectory()
  if (fs.existsSync(logoDir)) {
    await fs.promises.cp(logoDir, path.join(backupDir, LIBRARY_FOLDER_LOGO_DIRECTORY), {
      recursive: true,
    })
  }

  return backupDir
}

// 覆盖本地文件
async function restoreLocalFiles(remoteBasePath: string, client: SyncClient) {
  const entries = await client.listDirectory(remoteBasePath)
  if (
    entries.some(
      (entry) => entry.type === 'directory' && entry.basename === LIBRARY_FOLDER_LOGO_DIRECTORY,
    )
  ) {
    const remoteLogoDir = `${remoteBasePath}/${LIBRARY_FOLDER_LOGO_DIRECTORY}`
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

  // 覆盖游戏存档目录
  const gameSaveConfig = await getGameSaveConfig()
  if (gameSaveConfig.enabled && gameSaveConfig.directory) {
    const saveDir = gameSaveConfig.directory.trim()
    if (saveDir) {
      await client.downloadDirectory(remoteBasePath + '/game-saves', saveDir)
    }
  }

  // 覆盖local.db文件
  const dbPath = getDbPath()
  await client.downloadFile(remoteBasePath + '/local.db', dbPath)
}

// 从WebDAV下载备份并覆盖本地
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { backupName } = body

    if (!backupName) {
      return NextResponse.json({ error: '请指定要下载的备份' }, { status: 400 })
    }

    // 防止路径遍历攻击
    if (backupName.includes('..') || backupName.includes('/') || backupName.includes('\\')) {
      return NextResponse.json({ error: '无效的备份名称' }, { status: 400 })
    }

    // 获取启用配置的客户端
    const client = await getEnabledSyncClient()
    if (!client) {
      return NextResponse.json(
        { error: '同步服务器配置未设置，请先在设置中配置同步服务器' },
        { status: 400 },
      )
    }

    // 测试连接
    const connected = await client.testConnection()
    if (!connected) {
      return NextResponse.json({ error: '无法连接到同步服务器，请检查配置' }, { status: 400 })
    }

    const syncConfig = await getEnabledSyncConfig()
    const remoteRoot = (syncConfig?.remotePath || '/vnweb-backup').replace(/\/+$/g, '')
    const remoteBasePath = `${remoteRoot}/${backupName}`

    // 先备份本地文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupDir = await backupLocalFiles(timestamp)

    // 从WebDAV下载并覆盖本地
    await restoreLocalFiles(remoteBasePath, client)

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
