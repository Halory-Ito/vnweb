import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

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

// 获取备份目录
function getBackupDir() {
  const documentsPath = path.join(os.homedir(), 'Documents')
  return path.join(documentsPath, 'VnBackups')
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

export async function POST(req: NextRequest) {
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
    const backupPath = path.join(backupDir, backupId)

    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: '备份不存在' }, { status: 404 })
    }

    // 1. 恢复数据库
    const extractedDbPath = path.join(backupPath, 'database', 'local.db')
    const currentDbPath = getDbPath()

    if (fs.existsSync(extractedDbPath)) {
      // 备份当前数据库
      if (fs.existsSync(currentDbPath)) {
        await fs.promises.copyFile(currentDbPath, currentDbPath + '.bak')
      }
      await fs.promises.copyFile(extractedDbPath, currentDbPath)
    }

    // 2. 恢复 assets 目录
    const extractedAssetsPath = path.join(backupPath, 'assets')
    const currentAssetsPath = getAssetsPath()

    if (fs.existsSync(extractedAssetsPath)) {
      // 备份当前 assets
      if (fs.existsSync(currentAssetsPath)) {
        const backupAssetsPath = currentAssetsPath + '.bak'
        await fs.promises.rm(backupAssetsPath, { force: true })
        await fs.promises.rename(currentAssetsPath, backupAssetsPath)
      }

      // 复制新 assets
      await fs.promises.cp(extractedAssetsPath, currentAssetsPath, {
        recursive: true,
      })
    }

    // 3. 恢复游戏存档目录
    const extractedSavePath = path.join(backupPath, 'game-saves')
    if (fs.existsSync(extractedSavePath)) {
      const gameSaveConfig = await getGameSaveConfig()
      if (gameSaveConfig.enabled && gameSaveConfig.directory) {
        const currentSaveDir = gameSaveConfig.directory.trim()
        if (currentSaveDir) {
          // 备份当前存档目录
          if (fs.existsSync(currentSaveDir)) {
            const backupSaveDir = currentSaveDir + '.bak'
            await fs.promises.rm(backupSaveDir, { force: true })
            await fs.promises.rename(currentSaveDir, backupSaveDir)
          }

          // 复制新存档
          await fs.promises.cp(extractedSavePath, currentSaveDir, {
            recursive: true,
          })
        }
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        message: '备份恢复成功',
      },
    })
  } catch (error) {
    console.error('Restore local backup failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '恢复备份失败' },
      { status: 500 },
    )
  }
}
