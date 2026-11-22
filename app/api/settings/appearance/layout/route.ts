import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'
import { type LayoutSettings, normalizeLayoutSettings } from '@/lib/settings/layout-settings'

const LAYOUT_KEYS: Array<keyof LayoutSettings> = [
  'sidebarHidden',
  'headerHidden',
  'borderless',
  'gameLibraryLayout',
  'gameLibraryGridDisplay',
  'gameLibraryGroup',
  'gameCardTitleHidden',
  'gameCardRadius',
  'folderPalette',
  'folderColors',
  'folderLogos',
]

async function readLayoutSettings(): Promise<{ data: LayoutSettings; persisted: boolean }> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const rawLayout = appearance['layout']
  const persisted = typeof rawLayout === 'object' && rawLayout !== null && !Array.isArray(rawLayout)

  return {
    data: normalizeLayoutSettings(persisted ? (rawLayout as Record<string, unknown>) : undefined),
    persisted,
  }
}

export async function GET() {
  try {
    const result = await readLayoutSettings()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get layout settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取布局设置失败' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const { data: current } = await readLayoutSettings()
    const merged: Record<string, unknown> = { ...current }

    for (const key of LAYOUT_KEYS) {
      if (key in body && body[key] !== undefined) {
        merged[key] = body[key]
      }
    }

    const next = normalizeLayoutSettings(merged)
    await updateConfigSection(['settings', 'appearance', 'layout'], next)

    return NextResponse.json({ data: next, persisted: true })
  } catch (error) {
    console.error('Update layout settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新布局设置失败' },
      { status: 500 },
    )
  }
}
