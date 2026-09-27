import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'

const STATUS_COLOR_KEYS = ['0', '1', '2', '3', '4', '5'] as const

type StatusColorSettings = Record<string, string>

const DEFAULT_STATUS_COLORS: StatusColorSettings = {
  '0': '#a1a1aa',
  '1': '#34d399',
  '2': '#fbbf24',
  '3': '#38bdf8',
  '4': '#a78bfa',
  '5': '#fb7185',
}

// 读取游戏状态颜色设置
async function readStatusColors(): Promise<StatusColorSettings> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const status = (appearance['status'] || {}) as Record<string, unknown>
  const color = (status['color'] || {}) as Record<string, unknown>

  const result: StatusColorSettings = { ...DEFAULT_STATUS_COLORS }
  for (const key of STATUS_COLOR_KEYS) {
    const value = color[key]
    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim()
    }
  }

  return result
}

// 获取游戏状态颜色设置
export async function GET(_req: NextRequest) {
  try {
    const settings = await readStatusColors()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Get status settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取游戏状态设置失败' },
      { status: 500 },
    )
  }
}

// 更新游戏状态颜色设置
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<StatusColorSettings>
    const current = await readStatusColors()

    for (const key of STATUS_COLOR_KEYS) {
      const value = body[key]
      if (typeof value === 'string' && value.trim()) {
        current[key] = value.trim()
      }
    }

    // 只更新 settings.appearance.status.color，不影响其他属性
    await updateConfigSection(['settings', 'appearance', 'status', 'color'], {
      ...current,
    })

    return NextResponse.json({ data: current })
  } catch (error) {
    console.error('Update status settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新游戏状态设置失败' },
      { status: 500 },
    )
  }
}
