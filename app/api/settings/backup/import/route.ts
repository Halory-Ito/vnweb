import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

import {
  mergeBackupAssetDirectory,
  restoreBackupSettingsDirectory,
} from '@/lib/server/backup-content'
import { readGameSaveBackupConfig as getGameSaveConfig } from '@/lib/server/config-rw'
import { getDbPath } from '@/lib/server/database-config.mjs'
import { migrateLegacyLibraryLogoDirectory } from '@/lib/server/library-folder-logo-files'
import { getAssetsDir, getLegacyPublicAssetsDir, getTempDir } from '@/lib/server/runtime-paths.mjs'

// 获取 assets 目录路径
function getAssetsPath() {
  return getAssetsDir()
}

// 获取 public/assets 目录路径
function getPublicAssetsPath() {
  return getLegacyPublicAssetsDir()
}

// 解压 zip 文件
async function extractZip(
  buffer: Buffer,
  targetDir: string,
): Promise<{
  dbPath: string | null
  assetsDir: string | null
  publicAssetsDir: string | null
  gameSavesDir: string | null
  settingsDir: string | null
}> {
  // 动态导入 adm-zip
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip(buffer)
  const resolvedRoot = path.resolve(targetDir)

  let dbPath: string | null = null

  // 提取所有文件
  const entries = zip.getEntries()
  for (const entry of entries) {
    const entryPath = entry.entryName

    // 跳过目录
    if (entry.isDirectory) {
      continue
    }

    if (
      !entryPath.startsWith('database/') &&
      !entryPath.startsWith('assets/') &&
      !entryPath.startsWith('public-assets/') &&
      !entryPath.startsWith('game-saves/') &&
      !entryPath.startsWith('settings/')
    ) {
      continue
    }

    const targetPath = path.resolve(targetDir, entryPath)
    if (!targetPath.startsWith(resolvedRoot + path.sep)) {
      continue
    }

    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })
    await fs.promises.writeFile(targetPath, entry.getData())
    if (entryPath.startsWith('database/')) {
      dbPath = targetPath
    }
  }

  return {
    dbPath,
    assetsDir: path.join(targetDir, 'assets'),
    publicAssetsDir: path.join(targetDir, 'public-assets'),
    gameSavesDir: path.join(targetDir, 'game-saves'),
    settingsDir: path.join(targetDir, 'settings'),
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到上传文件' }, { status: 400 })
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: '仅支持 ZIP 格式的备份文件' }, { status: 400 })
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 创建临时目录
    const tempDir = getTempDir()
    await fs.promises.mkdir(tempDir, { recursive: true })

    try {
      // 解压文件
      const {
        dbPath: extractedDbPath,
        assetsDir: extractedAssetsPath,
        publicAssetsDir: extractedPublicAssetsPath,
        gameSavesDir: extractedGameSavesDir,
        settingsDir: extractedSettingsDir,
      } = await extractZip(buffer, tempDir)

      // 替换数据库文件
      const currentDbPath = getDbPath()
      if (extractedDbPath && fs.existsSync(/*turbopackIgnore: true*/ extractedDbPath)) {
        // 备份当前数据库
        const backupPath = currentDbPath + '.bak'
        if (fs.existsSync(currentDbPath)) {
          await fs.promises.copyFile(currentDbPath, backupPath)
        }

        // 替换数据库
        await fs.promises.copyFile(extractedDbPath, currentDbPath)
      }

      // 合并恢复 assets 与 public/assets 目录
      if (extractedAssetsPath) {
        await mergeBackupAssetDirectory(extractedAssetsPath, getAssetsPath())
      }
      if (extractedPublicAssetsPath) {
        await mergeBackupAssetDirectory(extractedPublicAssetsPath, getPublicAssetsPath())
      }
      await migrateLegacyLibraryLogoDirectory()

      // 恢复游戏存档目录
      if (extractedGameSavesDir && fs.existsSync(/*turbopackIgnore: true*/ extractedGameSavesDir)) {
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
            await fs.promises.cp(extractedGameSavesDir, currentSaveDir, {
              recursive: true,
            })
          }
        }
      }

      // 恢复设置文件
      if (extractedSettingsDir) {
        await restoreBackupSettingsDirectory(extractedSettingsDir)
      }

      return NextResponse.json({
        success: true,
        message: '备份导入成功',
      })
    } finally {
      // 清理临时目录
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    }
  } catch (error) {
    console.error('Import backup failed:', error)
    return NextResponse.json({ error: (error as Error).message || '导入备份失败' }, { status: 500 })
  }
}
