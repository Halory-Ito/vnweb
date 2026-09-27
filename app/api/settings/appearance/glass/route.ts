import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'

type GlassSettings = {
  blur: number
  opacity: number
}

const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  blur: 24,
  opacity: 24,
}

// 读取毛玻璃设置
async function readGlassSettings(): Promise<GlassSettings> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const glass = (appearance['glass'] || {}) as Record<string, unknown>

  const blur = Number(glass['blur'])
  const opacity = Number(glass['opacity'])

  return {
    blur: Number.isFinite(blur)
      ? Math.min(150, Math.max(0, Math.round(blur)))
      : DEFAULT_GLASS_SETTINGS.blur,
    opacity: Number.isFinite(opacity)
      ? Math.min(100, Math.max(0, Math.round(opacity)))
      : DEFAULT_GLASS_SETTINGS.opacity,
  }
}

// 获取毛玻璃设置
export async function GET(_req: NextRequest) {
  try {
    const settings = await readGlassSettings()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Get glass settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取毛玻璃设置失败' },
      { status: 500 },
    )
  }
}

// 更新毛玻璃设置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { blur, opacity } = body as Partial<GlassSettings>

    const current = await readGlassSettings()

    if (typeof blur === 'number' && Number.isFinite(blur)) {
      current.blur = Math.min(150, Math.max(0, Math.round(blur)))
    }

    if (typeof opacity === 'number' && Number.isFinite(opacity)) {
      current.opacity = Math.min(100, Math.max(0, Math.round(opacity)))
    }

    // 只更新 settings.appearance.glass，不影响其他属性
    await updateConfigSection(['settings', 'appearance', 'glass'], {
      blur: current.blur,
      opacity: current.opacity,
    })

    return NextResponse.json({ data: current })
  } catch (error) {
    console.error('Update glass settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新毛玻璃设置失败' },
      { status: 500 },
    )
  }
}
