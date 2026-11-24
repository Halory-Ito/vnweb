import { NextRequest, NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'
import {
  normalizeMemoryMetadataFields,
  normalizeMemoryPlaybackSettings,
} from '@/lib/settings/memory-metadata-settings'

async function readMemorySettings() {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const memory = (settings['memory'] || {}) as Record<string, unknown>
  return {
    fields: normalizeMemoryMetadataFields(memory['metadataFields']),
    playback: normalizeMemoryPlaybackSettings(memory['playback']),
  }
}

export async function GET(_req: NextRequest) {
  try {
    const data = await readMemorySettings()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get memory settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取回忆设置失败' },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      fields?: unknown
      playback?: unknown
    } | null
    const hasFields = Boolean(body && Array.isArray(body.fields))
    const hasPlayback = Boolean(
      body && body.playback && typeof body.playback === 'object' && !Array.isArray(body.playback),
    )

    if (!hasFields && !hasPlayback) {
      return NextResponse.json({ error: '回忆设置参数格式无效' }, { status: 400 })
    }

    if (hasFields) {
      const fields = normalizeMemoryMetadataFields(body!.fields)
      await updateConfigSection(['settings', 'memory', 'metadataFields'], fields)
    }

    if (hasPlayback) {
      const current = await readMemorySettings()
      const playback = normalizeMemoryPlaybackSettings({
        ...current.playback,
        ...(body!.playback as Record<string, unknown>),
      })
      await updateConfigSection(['settings', 'memory', 'playback'], playback)
    }

    const updated = await readMemorySettings()
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Save memory settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '保存回忆设置失败' },
      { status: 500 },
    )
  }
}
