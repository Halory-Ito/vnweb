import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

const CONFIG_FILE = path.join(process.cwd(), 'app', 'config.json')

type ChartSettings = {
  color: string
  opacity: number
}

const DEFAULT_CHART_SETTINGS: ChartSettings = {
  color: '#4f46e5',
  opacity: 100,
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

// 读取图表设置
async function readChartSettings(): Promise<ChartSettings> {
  const fullConfig = await readFullConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const chart = (appearance['chart'] || {}) as Record<string, unknown>

  const opacity = Number(chart['opacity'])
  return {
    color:
      typeof chart['color'] === 'string'
        ? chart['color']
        : DEFAULT_CHART_SETTINGS.color,
    opacity: Number.isFinite(opacity)
      ? Math.min(100, Math.max(0, Math.round(opacity)))
      : DEFAULT_CHART_SETTINGS.opacity,
  }
}

// 写入图表设置
async function writeChartSettings(chartSettings: ChartSettings) {
  const fullConfig = await readFullConfig()

  if (!fullConfig['settings']) {
    fullConfig['settings'] = {}
  }
  const settings = fullConfig['settings'] as Record<string, unknown>

  if (!settings['appearance']) {
    settings['appearance'] = {}
  }
  const appearance = settings['appearance'] as Record<string, unknown>

  appearance['chart'] = {
    color: chartSettings.color,
    opacity: chartSettings.opacity,
  }

  await writeFullConfig(fullConfig)
}

// 获取图表设置
export async function GET(_req: NextRequest) {
  try {
    const settings = await readChartSettings()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Get chart settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取图表设置失败' },
      { status: 500 },
    )
  }
}

// 更新图表设置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { color, opacity } = body as Partial<ChartSettings>

    const current = await readChartSettings()

    if (typeof color === 'string') {
      current.color = color
    }

    if (typeof opacity === 'number' && Number.isFinite(opacity)) {
      current.opacity = Math.min(100, Math.max(0, Math.round(opacity)))
    }

    await writeChartSettings(current)

    return NextResponse.json({ data: current })
  } catch (error) {
    console.error('Update chart settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新图表设置失败' },
      { status: 500 },
    )
  }
}
