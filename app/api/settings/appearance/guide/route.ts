import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

const CONFIG_FILE = path.join(process.cwd(), 'app', 'config.json')

type GuideColorSettings = {
  choice: string
  save: string
  load: string
  note: string
}

const DEFAULT_GUIDE_SETTINGS: GuideColorSettings = {
  choice: '#3b82f6',
  save: '#10b981',
  load: '#f59e0b',
  note: '#6b7280',
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

// 读取 Guide 设置
async function readGuideSettings(): Promise<GuideColorSettings> {
  const fullConfig = await readFullConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const guide = (appearance['guide'] || {}) as Record<string, unknown>
  const color = (guide['color'] || {}) as Record<string, unknown>

  return {
    choice:
      typeof color['choice'] === 'string'
        ? color['choice']
        : DEFAULT_GUIDE_SETTINGS.choice,
    save:
      typeof color['save'] === 'string'
        ? color['save']
        : DEFAULT_GUIDE_SETTINGS.save,
    load:
      typeof color['load'] === 'string'
        ? color['load']
        : DEFAULT_GUIDE_SETTINGS.load,
    note:
      typeof color['note'] === 'string'
        ? color['note']
        : DEFAULT_GUIDE_SETTINGS.note,
  }
}

// 写入 Guide 设置
async function writeGuideSettings(guideSettings: GuideColorSettings) {
  const fullConfig = await readFullConfig()

  if (!fullConfig['settings']) {
    fullConfig['settings'] = {}
  }
  const settings = fullConfig['settings'] as Record<string, unknown>

  if (!settings['appearance']) {
    settings['appearance'] = {}
  }
  const appearance = settings['appearance'] as Record<string, unknown>

  if (!appearance['guide']) {
    appearance['guide'] = {}
  }
  const guide = appearance['guide'] as Record<string, unknown>

  guide['color'] = {
    choice: guideSettings.choice,
    save: guideSettings.save,
    load: guideSettings.load,
    note: guideSettings.note,
  }

  await writeFullConfig(fullConfig)
}

// 获取 Guide 设置
export async function GET(_req: NextRequest) {
  try {
    const settings = await readGuideSettings()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Get guide settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取攻略设置失败' },
      { status: 500 },
    )
  }
}

// 更新 Guide 设置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { choice, save, load, note } = body as Partial<GuideColorSettings>

    const current = await readGuideSettings()

    if (typeof choice === 'string') {
      current.choice = choice
    }

    if (typeof save === 'string') {
      current.save = save
    }

    if (typeof load === 'string') {
      current.load = load
    }

    if (typeof note === 'string') {
      current.note = note
    }

    await writeGuideSettings(current)

    return NextResponse.json({ data: current })
  } catch (error) {
    console.error('Update guide settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新攻略设置失败' },
      { status: 500 },
    )
  }
}
