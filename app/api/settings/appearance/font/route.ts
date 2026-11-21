import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'
import { type FontSettings, normalizeFontSettings } from '@/lib/settings/font-settings'

async function readFontConfig(): Promise<{ data: FontSettings; persisted: boolean }> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const rawFont = appearance['font']
  const persisted = typeof rawFont === 'object' && rawFont !== null && !Array.isArray(rawFont)

  return {
    data: normalizeFontSettings(persisted ? (rawFont as Partial<FontSettings>) : {}),
    persisted,
  }
}

export async function GET() {
  try {
    const result = await readFontConfig()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get font settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取字体设置失败' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<FontSettings>
    const { data: current } = await readFontConfig()
    const next = normalizeFontSettings({
      fontPath: body.fontPath ?? current.fontPath,
      fontSize: body.fontSize ?? current.fontSize,
      fontWeight: body.fontWeight ?? current.fontWeight,
    })

    await updateConfigSection(['settings', 'appearance', 'font'], next)

    return NextResponse.json({ data: next, persisted: true })
  } catch (error) {
    console.error('Update font settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新字体设置失败' },
      { status: 500 },
    )
  }
}
