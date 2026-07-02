import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

// 配置文件路径
const CONFIG_FILE = path.join(process.cwd(), 'app', 'config.json')

type GameSaveConfig = {
  enabled: boolean
  directory: string
}

// 读取完整配置
async function readFullConfig(): Promise<Record<string, unknown>> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = await fs.promises.readFile(CONFIG_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch {
    // ignore
  }
  return {}
}

// 读取游戏存档配置
async function readGameSaveConfig(): Promise<GameSaveConfig> {
  const fullConfig = await readFullConfig()
  const gameSave = (fullConfig['game-save-config'] || {}) as Record<
    string,
    unknown
  >
  return {
    enabled: Boolean(gameSave.open_save_dir),
    directory:
      typeof gameSave.save_dir_path === 'string' ? gameSave.save_dir_path : '',
  }
}

// 写入游戏存档配置
async function writeGameSaveConfig(config: GameSaveConfig) {
  const fullConfig = await readFullConfig()
  fullConfig['game-save-config'] = {
    open_save_dir: config.enabled,
    save_dir_path: config.directory,
  }
  await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(fullConfig, null, 4))
}

// 获取游戏存档配置
export async function GET(_req: NextRequest) {
  try {
    const config = await readGameSaveConfig()
    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('Get game save config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取游戏存档配置失败' },
      { status: 500 },
    )
  }
}

// 更新游戏存档配置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { enabled, directory } = body as Partial<GameSaveConfig>

    const config = await readGameSaveConfig()

    if (typeof enabled === 'boolean') {
      config.enabled = enabled
    }

    if (typeof directory === 'string') {
      config.directory = directory
    }

    // 验证目录是否存在（如果启用了存档备份）
    if (config.enabled && config.directory) {
      if (!fs.existsSync(config.directory)) {
        return NextResponse.json(
          { error: '指定的存档目录不存在' },
          { status: 400 },
        )
      }
    }

    await writeGameSaveConfig(config)

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('Update game save config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新游戏存档配置失败' },
      { status: 500 },
    )
  }
}
