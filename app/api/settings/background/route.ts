import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

const CONFIG_FILE = path.join(process.cwd(), 'app', 'config.json')

type BackgroundCustomSettings = {
  active: boolean
  path: {
    pc: string
    mobile: string
  }
}

const DEFAULT_BACKGROUND_CUSTOM_SETTINGS: BackgroundCustomSettings = {
  active: false,
  path: {
    pc: '',
    mobile: '',
  },
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

// 写入完整配置
async function writeFullConfig(config: Record<string, unknown>) {
  await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(config, null, 4))
}

// 读取背景自定义设置
async function readBackgroundCustomSettings(): Promise<BackgroundCustomSettings> {
  const fullConfig = await readFullConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const background = (appearance['background'] || {}) as Record<string, unknown>
  const custom = (background['custom'] || {}) as Record<string, unknown>

  const path = (custom['path'] || {}) as Record<string, unknown>

  return {
    active: typeof custom['active'] === 'boolean' ? custom['active'] : DEFAULT_BACKGROUND_CUSTOM_SETTINGS.active,
    path: {
      pc: typeof path['pc'] === 'string' ? path['pc'] : DEFAULT_BACKGROUND_CUSTOM_SETTINGS.path.pc,
      mobile: typeof path['mobile'] === 'string' ? path['mobile'] : DEFAULT_BACKGROUND_CUSTOM_SETTINGS.path.mobile,
    },
  }
}

// 写入背景自定义设置
async function writeBackgroundCustomSettings(backgroundSettings: BackgroundCustomSettings) {
  const fullConfig = await readFullConfig()

  if (!fullConfig['settings']) {
    fullConfig['settings'] = {}
  }
  const settings = fullConfig['settings'] as Record<string, unknown>

  if (!settings['appearance']) {
    settings['appearance'] = {}
  }
  const appearance = settings['appearance'] as Record<string, unknown>

  if (!appearance['background']) {
    appearance['background'] = {}
  }
  const background = appearance['background'] as Record<string, unknown>

  background['custom'] = {
    active: backgroundSettings.active,
    path: backgroundSettings.path,
  }

  await writeFullConfig(fullConfig)
}

// 获取背景自定义设置
export async function GET(_req: NextRequest) {
  try {
    const settings = await readBackgroundCustomSettings()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Get background custom settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取背景自定义设置失败' },
      { status: 500 },
    )
  }
}

// 更新背景自定义设置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { active, path } = body as Partial<BackgroundCustomSettings>

    const current = await readBackgroundCustomSettings()

    if (typeof active === 'boolean') {
      current.active = active
    }

    if (path && typeof path === 'object') {
      if (typeof path.pc === 'string') {
        current.path.pc = path.pc
      }
      if (typeof path.mobile === 'string') {
        current.path.mobile = path.mobile
      }
    }

    await writeBackgroundCustomSettings(current)

    return NextResponse.json({ data: current })
  } catch (error) {
    console.error('Update background custom settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新背景自定义设置失败' },
      { status: 500 },
    )
  }
}
