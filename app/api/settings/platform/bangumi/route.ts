import { NextResponse } from 'next/server'

import { readPlatformSettings, updatePlatformSettings } from '@/lib/server/platform-settings'
import { BANGUMI_OFFICIAL_API_URL } from '@/lib/settings/bangumi-settings'

export async function GET() {
  const settings = await readPlatformSettings()
  return NextResponse.json({
    data: {
      mirrorUrl: settings.bangumi.mirrorUrl,
      defaultMirrorUrl: BANGUMI_OFFICIAL_API_URL,
    },
  })
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as { mirrorUrl?: unknown }
    const mirrorUrl = typeof payload.mirrorUrl === 'string' ? payload.mirrorUrl : ''
    const updated = await updatePlatformSettings('bangumi', { mirrorUrl })

    return NextResponse.json({
      data: {
        mirrorUrl: updated.bangumi.mirrorUrl,
        defaultMirrorUrl: BANGUMI_OFFICIAL_API_URL,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '镜像地址格式不正确'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
