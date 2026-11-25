import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  mergeBackupAssetDirectory,
  restoreBackupSettingsDirectory,
} from '@/lib/server/backup-content'
import { readGameSaveBackupConfig as getGameSaveConfig } from '@/lib/server/config-rw'
import { getDbPath } from '@/lib/server/database-config.mjs'
import { migrateLegacyLibraryLogoDirectory } from '@/lib/server/library-folder-logo-files'
import { getAssetsDir, getLegacyPublicAssetsDir } from '@/lib/server/runtime-paths.mjs'

// 获取 assets 目录路径
function getAssetsPath() {
  return getAssetsDir()
}

// 获取 public/assets 目录路径
function getPublicAssetsPath() {
  return getLegacyPublicAssetsDir()
}

// 获取备份目录
function getBackupDir() {
  const documentsPath = path.join(os.homedir(), 'Documents')
  return path.join(documentsPath, 'VnBackups')
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

    // 2. 合并恢复 assets 与 public/assets 目录（避免部分备份恢复覆盖后丢失未包含资源）
    await mergeBackupAssetDirectory(path.join(backupPath, 'assets'), getAssetsPath())
    await mergeBackupAssetDirectory(path.join(backupPath, 'public-assets'), getPublicAssetsPath())
    await migrateLegacyLibraryLogoDirectory()

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

    // 4. 恢复设置文件
    await restoreBackupSettingsDirectory(path.join(backupPath, 'settings'))

    return NextResponse.json({
      data: {
        success: true,
        message: '备份恢复成功',
      },
    })
  } catch (error) {
    console.error('Restore local backup failed:', error)
    return NextResponse.json({ error: (error as Error).message || '恢复备份失败' }, { status: 500 })
  }
}
