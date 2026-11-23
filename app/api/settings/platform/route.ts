import { NextResponse } from 'next/server'

import {
  InvalidPlatformSettingsError,
  maskPlatformSettings,
  readPlatformSettings,
  updatePlatformSettings,
  type PlatformKey,
  type PlatformSettingsData,
} from '@/lib/server/platform-settings'

const VALID_PLATFORMS: ReadonlySet<PlatformKey> = new Set([
  'steam',
  'bangumi',
  'vndb',
  'ymgal',
  'steamgriddb',
  'meting',
  'enhanced',
])

export async function GET() {
  try {
    const settings = await readPlatformSettings()
    return NextResponse.json({ data: maskPlatformSettings(settings) })
  } catch (error) {
    console.error('Get platform settings failed:', error)
    return NextResponse.json({ error: '读取平台设置失败' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      platform?: unknown
      config?: unknown
    }

    if (
      !payload ||
      typeof payload.platform !== 'string' ||
      !VALID_PLATFORMS.has(payload.platform as PlatformKey)
    ) {
      return NextResponse.json({ error: '不支持的平台类型' }, { status: 400 })
    }

    if (!payload.config || typeof payload.config !== 'object' || Array.isArray(payload.config)) {
      return NextResponse.json({ error: '非法的配置参数' }, { status: 400 })
    }

    const platform = payload.platform as PlatformKey
    const updated = await updatePlatformSettings(
      platform,
      payload.config as Partial<PlatformSettingsData[typeof platform]>,
    )

    return NextResponse.json({ data: maskPlatformSettings(updated) })
  } catch (error) {
    if (error instanceof InvalidPlatformSettingsError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Save platform settings failed:', error)
    return NextResponse.json({ error: '保存平台设置失败' }, { status: 500 })
  }
}
