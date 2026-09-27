import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { getWebDAVConfig, WebDAVClient } from '@/lib/webdav-utils'

// 获取数据库路径
function getDbPath() {
  const dbUrl = process.env.DB_FILE_NAME?.trim() || 'file:./local.db'
  if (dbUrl.startsWith('file:')) {
    return path.join(process.cwd(), dbUrl.replace('file:', ''))
  }
  return dbUrl
}

// 获取游戏存档配置
async function getGameSaveConfig(): Promise<{
  enabled: boolean
  directory: string
}> {
  try {
    const configFile = path.join(process.cwd(), 'app', 'config.json')
    if (fs.existsSync(configFile)) {
      const content = await fs.promises.readFile(configFile, 'utf-8')
      const config = JSON.parse(content)
      const settings = (config['settings'] || {}) as Record<string, unknown>
      const backup = (settings['backup'] || {}) as Record<string, unknown>
      const save = (backup['save'] || {}) as Record<string, unknown>
      return {
        enabled: Boolean(save.active),
        directory: typeof save.dir === 'string' ? save.dir : '',
      }
    }
  } catch {
    // ignore
  }
  return { enabled: false, directory: '' }
}

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

  return backupDir
}

// 覆盖本地文件
async function restoreLocalFiles(remoteBasePath: string, client: WebDAVClient) {
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

    // 获取WebDAV配置
    const config = await getWebDAVConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'WebDAV配置未设置，请先在设置中配置WebDAV' },
        { status: 400 },
      )
    }

    const client = new WebDAVClient(config)

    // 测试连接
    const connected = await client.testConnection()
    if (!connected) {
      return NextResponse.json({ error: '无法连接到WebDAV服务器，请检查配置' }, { status: 400 })
    }

    const remoteBasePath = config.remotePath + '/' + backupName

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
