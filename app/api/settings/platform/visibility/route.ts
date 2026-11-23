import { NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'
import { platformVisibilityKeys } from '@/lib/settings/platform-visibility'

export async function GET() {
  const { settings } = await readConfig()
  const values = (settings as { platformVisibility?: Record<string, unknown> })?.platformVisibility
  return NextResponse.json(
    Object.fromEntries(
      platformVisibilityKeys
        .filter((key) => typeof values?.[key] === 'boolean')
        .map((key) => [key, values?.[key]]),
    ),
  )
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  const key = platformVisibilityKeys.find((key) => key === body?.platform)
  if (!key || typeof body?.visible !== 'boolean')
    return NextResponse.json({ error: 'Invalid platform visibility' }, { status: 400 })
  await updateConfigSection(['settings', 'platformVisibility', key], body.visible)
  return GET()
}
