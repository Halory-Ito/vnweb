import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'
import {
  type EmptyStateSettings,
  normalizeEmptyStateSettings,
} from '@/lib/settings/empty-state-settings'

async function readEmptyStateConfig(): Promise<{ data: EmptyStateSettings; persisted: boolean }> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const rawEmptyState = appearance['emptyState']
  const persisted =
    typeof rawEmptyState === 'object' && rawEmptyState !== null && !Array.isArray(rawEmptyState)

  return {
    data: normalizeEmptyStateSettings(
      persisted ? (rawEmptyState as Record<string, unknown>) : undefined,
    ),
    persisted,
  }
}

export async function GET() {
  try {
    const result = await readEmptyStateConfig()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get empty state settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取空状态设置失败' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<EmptyStateSettings>
    const { data: current } = await readEmptyStateConfig()
    const next = normalizeEmptyStateSettings({
      mode: body.mode ?? current.mode,
      kaomoji: body.kaomoji ?? current.kaomoji,
      images: body.images ?? current.images,
    })

    await updateConfigSection(['settings', 'appearance', 'emptyState'], next)

    return NextResponse.json({ data: next, persisted: true })
  } catch (error) {
    console.error('Update empty state settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新空状态设置失败' },
      { status: 500 },
    )
  }
}
