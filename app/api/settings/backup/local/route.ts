import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// 默认保留备份数量
const BACKUP_KEEP_COUNT = 10

// 获取数据库路径
function getDbPath() {
  const dbUrl = process.env.DB_FILE_NAME?.trim() || 'file:./local.db'
  if (dbUrl.startsWith('file:')) {
    return path.join(process.cwd(), dbUrl.replace('file:', ''))
  }
  return dbUrl
}

// 获取 assets 目录路径
function getAssetsPath() {
  return path.join(process.cwd(), 'assets')
}

// 需要包含的 assets 子目录
const ASSET_DIRS = ['cover', 'bg', 'icon', 'logo', 'ost', 'characters', 'pv']

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
      const gameSave = (config['game-save-config'] || {}) as Record<
        string,
        unknown
      >
      return {
        enabled: Boolean(gameSave.open_save_dir),
        directory:
          typeof gameSave.save_dir_path === 'string'
            ? gameSave.save_dir_path
            : '',
      }
    }
  } catch {
    // ignore
  }
  return { enabled: false, directory: '' }
}

// 获取备份目录
function getBackupDir() {
  // 默认使用 Documents/VnBackups
  const documentsPath = path.join(os.homedir(), 'Documents')
  return path.join(documentsPath, 'VnBackups')
}

// 获取本地备份列表
export async function GET(_req: NextRequest) {
  try {
    const backupDir = getBackupDir()

    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ data: [] })
    }

    const entries = await fs.promises.readdir(backupDir, {
      withFileTypes: true,
    })
    const backups: Array<{
      id: string
      name: string
      size: number
      createdAt: string
    }> = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (!entry.name.startsWith('vnweb-backup-')) continue

      const dirPath = path.join(backupDir, entry.name)
      const infoPath = path.join(dirPath, 'backup-info.json')

      let createdAt = ''
      let size = 0

      // 读取备份信息
      if (fs.existsSync(infoPath)) {
        try {
          const info = JSON.parse(await fs.promises.readFile(infoPath, 'utf-8'))
          createdAt = info.createdAt || ''
        } catch {
          // ignore
        }
      }

      // 计算目录大小
      const calcSize = async (dir: string): Promise<number> => {
        let total = 0
        const items = await fs.promises.readdir(dir, { withFileTypes: true })
        for (const item of items) {
          const itemPath = path.join(dir, item.name)
          if (item.isDirectory()) {
            total += await calcSize(itemPath)
          } else {
            const stat = await fs.promises.stat(itemPath)
            total += stat.size
          }
        }
        return total
      }

      size = await calcSize(dirPath)

      backups.push({
        id: entry.name,
        name: entry.name,
        size,
        createdAt,
      })
    }

    // 按时间倒序排列
    backups.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    return NextResponse.json({ data: backups })
  } catch (error) {
    console.error('List local backups failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取备份列表失败' },
      { status: 500 },
    )
  }
}

// 创建本地备份
export async function POST(_req: NextRequest) {
  try {
    const backupDir = getBackupDir()
    await fs.promises.mkdir(backupDir, { recursive: true })

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19)
    const backupName = `vnweb-backup-${timestamp}`
    const backupPath = path.join(backupDir, backupName)

    await fs.promises.mkdir(backupPath, { recursive: true })

    // 1. 复制数据库
    const dbPath = getDbPath()
    if (fs.existsSync(dbPath)) {
      const dbDir = path.join(backupPath, 'database')
      await fs.promises.mkdir(dbDir, { recursive: true })
      await fs.promises.copyFile(dbPath, path.join(dbDir, 'local.db'))
    }

    // 2. 复制 assets 目录
    const assetsPath = getAssetsPath()
    if (fs.existsSync(assetsPath)) {
      for (const dir of ASSET_DIRS) {
        const srcDir = path.join(assetsPath, dir)
        if (fs.existsSync(srcDir)) {
          const destDir = path.join(backupPath, 'assets', dir)
          await fs.promises.cp(srcDir, destDir, { recursive: true })
        }
      }
    }

    // 3. 复制游戏存档目录
    const gameSaveConfig = await getGameSaveConfig()
    if (gameSaveConfig.enabled && gameSaveConfig.directory) {
      const saveDir = gameSaveConfig.directory.trim()
      if (fs.existsSync(saveDir)) {
        const destSaveDir = path.join(backupPath, 'game-saves')
        await fs.promises.cp(saveDir, destSaveDir, { recursive: true })
      }
    }

    // 4. 写入备份信息
    const backupInfo = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      description: 'VNWeb Local Backup',
    }
    await fs.promises.writeFile(
      path.join(backupPath, 'backup-info.json'),
      JSON.stringify(backupInfo, null, 2),
    )

    // 4. 清理旧备份（保留最近 N 个）
    const keepCount = BACKUP_KEEP_COUNT
    const entries = await fs.promises.readdir(backupDir, {
      withFileTypes: true,
    })
    const backupDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('vnweb-backup-'))
      .map((e) => e.name)
      .sort()
      .reverse()

    if (backupDirs.length > keepCount) {
      const toDelete = backupDirs.slice(keepCount)
      for (const dir of toDelete) {
        await fs.promises.rm(path.join(backupDir, dir), {
          recursive: true,
          force: true,
        })
      }
    }

    return NextResponse.json({
      data: {
        id: backupName,
        name: backupName,
        createdAt: backupInfo.createdAt,
      },
    })
  } catch (error) {
    console.error('Create local backup failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '创建备份失败' },
      { status: 500 },
    )
  }
}

// 删除本地备份
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const backupId = searchParams.get('id')

    if (!backupId) {
      return NextResponse.json({ error: '缺少备份 ID' }, { status: 400 })
    }

    // 防止路径遍历攻击
    if (backupId.includes('..') || backupId.includes('/')) {
      return NextResponse.json({ error: '无效的备份 ID' }, { status: 400 })
    }

    const backupDir = getBackupDir()
    const targetPath = path.join(backupDir, backupId)

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ error: '备份不存在' }, { status: 404 })
    }

    await fs.promises.rm(targetPath, { recursive: true, force: true })

    return NextResponse.json({ data: { deleted: true, id: backupId } })
  } catch (error) {
    console.error('Delete local backup failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '删除备份失败' },
      { status: 500 },
    )
  }
}
