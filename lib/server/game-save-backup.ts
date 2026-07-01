import fs from 'node:fs'
import path from 'node:path'

// 配置文件路径
const CONFIG_FILE = path.join(process.cwd(), 'app', 'config.json')

type GameSaveConfig = {
  enabled: boolean
  directory: string
}

// 读取配置
async function readConfig(): Promise<GameSaveConfig> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = await fs.promises.readFile(CONFIG_FILE, 'utf-8')
      const fullConfig = JSON.parse(content)
      const gameSave = (fullConfig['game-save-config'] || {}) as Record<
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

/**
 * 备份游戏存档
 * @param gameName 游戏名称
 * @param saveDir 游戏存档目录
 */
export async function backupGameSave(
  gameName: string,
  saveDir: string,
): Promise<{ success: boolean; message: string }> {
  const config = await readConfig()

  if (!config.enabled) {
    return { success: false, message: '游戏存档备份未启用' }
  }

  if (!config.directory || !config.directory.trim()) {
    return { success: false, message: '全局游戏存档目录未配置' }
  }

  if (!saveDir || !saveDir.trim()) {
    return { success: false, message: '游戏存档目录未指定' }
  }

  // 检查游戏存档目录是否存在
  if (!fs.existsSync(saveDir)) {
    return { success: false, message: `游戏存档目录不存在: ${saveDir}` }
  }

  try {
    // 创建目标目录: 全局存档目录/游戏名称/存档目录名/
    const sanitizedGameName = gameName.replace(/[<>:"/\\|?*]/g, '_')
    const saveDirName = path.basename(saveDir)
    const targetDir = path.join(
      config.directory.trim(),
      sanitizedGameName,
      saveDirName,
    )
    await fs.promises.mkdir(targetDir, { recursive: true })

    // 复制存档文件
    await copyDirectory(saveDir, targetDir)

    console.log(`[GameSaveBackup] Backup success: ${gameName} -> ${targetDir}`)
    return { success: true, message: '游戏存档备份成功' }
  } catch (error) {
    console.error('[GameSaveBackup] Backup failed:', error)
    return {
      success: false,
      message: `备份失败: ${(error as Error).message}`,
    }
  }
}

/**
 * 递归复制目录
 */
async function copyDirectory(src: string, dest: string) {
  await fs.promises.mkdir(dest, { recursive: true })

  const entries = await fs.promises.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.promises.copyFile(srcPath, destPath)
    }
  }
}
