import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'

type ChartSettings = {
  color: string
  opacity: number
}

const DEFAULT_CHART_SETTINGS: ChartSettings = {
  color: '#4f46e5',
  opacity: 100,
}

// 读取图表设置
async function readChartSettings(): Promise<ChartSettings> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const chart = (appearance['chart'] || {}) as Record<string, unknown>

  const opacity = Number(chart['opacity'])
  return {
    color: typeof chart['color'] === 'string' ? chart['color'] : DEFAULT_CHART_SETTINGS.color,
    opacity: Number.isFinite(opacity)
      ? Math.min(100, Math.max(0, Math.round(opacity)))
      : DEFAULT_CHART_SETTINGS.opacity,
  }
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

    // 只更新 settings.appearance.chart，不影响其他属性
    await updateConfigSection(['settings', 'appearance', 'chart'], {
      color: current.color,
      opacity: current.opacity,
    })

    return NextResponse.json({ data: current })
  } catch (error) {
    console.error('Update chart settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新图表设置失败' },
      { status: 500 },
    )
  }
}
