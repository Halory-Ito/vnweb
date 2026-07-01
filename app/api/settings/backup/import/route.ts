import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

// 获取数据库路径
function getDbPath() {
  const dbUrl = process.env.DB_FILE_NAME?.trim() || 'file:./local.db'
  // 如果是 file:./local.db 格式，提取路径
  if (dbUrl.startsWith('file:')) {
    return path.join(process.cwd(), dbUrl.replace('file:', ''))
  }
  return dbUrl
}

// 获取 assets 目录路径
function getAssetsPath() {
  return path.join(process.cwd(), 'assets')
}

// 解压 zip 文件
async function extractZip(
  buffer: Buffer,
  targetDir: string,
): Promise<{
  dbPath: string | null
  assetsDir: string | null
  gameSavesDir: string | null
}> {
  // 动态导入 adm-zip
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip(buffer)

  let dbPath: string | null = null

  // 提取所有文件
  const entries = zip.getEntries()
  for (const entry of entries) {
    const entryPath = entry.entryName

    // 跳过目录
    if (entry.isDirectory) {
      continue
    }

    // 处理数据库文件
    if (entryPath.startsWith('database/')) {
      const targetPath = path.join(targetDir, entryPath)
      const targetDirPath = path.dirname(targetPath)
      await fs.promises.mkdir(targetDirPath, { recursive: true })
      await fs.promises.writeFile(targetPath, entry.getData())
      dbPath = targetPath
    }

    // 处理 assets 文件
    if (entryPath.startsWith('assets/')) {
      const targetPath = path.join(targetDir, entryPath)
      const targetDirPath = path.dirname(targetPath)
      await fs.promises.mkdir(targetDirPath, { recursive: true })
      await fs.promises.writeFile(targetPath, entry.getData())
    }

    // 处理游戏存档文件
    if (entryPath.startsWith('game-saves/')) {
      const targetPath = path.join(targetDir, entryPath)
      const targetDirPath = path.dirname(targetPath)
      await fs.promises.mkdir(targetDirPath, { recursive: true })
      await fs.promises.writeFile(targetPath, entry.getData())
    }
  }

  return {
    dbPath,
    assetsDir: path.join(targetDir, 'assets'),
    gameSavesDir: path.join(targetDir, 'game-saves'),
  }
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
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到上传文件' }, { status: 400 })
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: '仅支持 ZIP 格式的备份文件' },
        { status: 400 },
      )
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 创建临时目录
    const tempDir = path.join(process.cwd(), 'temp-backup')
    await fs.promises.mkdir(tempDir, { recursive: true })

    try {
      // 解压文件
      const { dbPath: extractedDbPath, gameSavesDir: extractedGameSavesDir } =
        await extractZip(buffer, tempDir)

      // 替换数据库文件
      const currentDbPath = getDbPath()
      if (extractedDbPath && fs.existsSync(extractedDbPath)) {
        // 备份当前数据库
        const backupPath = currentDbPath + '.bak'
        if (fs.existsSync(currentDbPath)) {
          await fs.promises.copyFile(currentDbPath, backupPath)
        }

        // 替换数据库
        await fs.promises.copyFile(extractedDbPath, currentDbPath)
      }

      // 替换 assets 目录
      const currentAssetsPath = getAssetsPath()
      const extractedAssetsPath = path.join(tempDir, 'assets')
      if (fs.existsSync(extractedAssetsPath)) {
        // 备份当前 assets
        if (fs.existsSync(currentAssetsPath)) {
          const backupPath = currentAssetsPath + '.bak'
          await fs.promises.rm(backupPath, { force: true })
          await fs.promises.rename(currentAssetsPath, backupPath)
        }

        // 复制新 assets
        await fs.promises.cp(extractedAssetsPath, currentAssetsPath, {
          recursive: true,
        })
      }

      // 恢复游戏存档目录
      if (extractedGameSavesDir && fs.existsSync(extractedGameSavesDir)) {
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
    return NextResponse.json(
      { error: (error as Error).message || '导入备份失败' },
      { status: 500 },
    )
  }
}
