import { NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'
import {
  allPlatformFeatureToggleKeys,
  getPlatformFeatureKey,
  isPlatformVisibilityKey,
  isValidPlatformFeaturePair,
  platformVisibilityKeys,
  type PlatformFeatureToggleKey,
  type PlatformVisibilityKey,
} from '@/lib/settings/platform-visibility'

const ALLOWED_VISIBILITY_KEYS: ReadonlyArray<PlatformVisibilityKey | PlatformFeatureToggleKey> = [
  ...platformVisibilityKeys,
  ...allPlatformFeatureToggleKeys,
]

export async function GET() {
  const { settings } = await readConfig()
  const values = (settings as { platformVisibility?: Record<string, unknown> })?.platformVisibility
  return NextResponse.json(
    Object.fromEntries(
      ALLOWED_VISIBILITY_KEYS.filter((key) => typeof values?.[key] === 'boolean').map((key) => [
        key,
        values?.[key],
      ]),
    ),
  )
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.visible !== 'boolean' || typeof body.platform !== 'string') {
    return NextResponse.json({ error: 'Invalid platform visibility' }, { status: 400 })
  }

  if (typeof body.category === 'string') {
    if (
      !isPlatformVisibilityKey(body.platform) ||
      !isValidPlatformFeaturePair(body.category, body.platform)
    ) {
      return NextResponse.json({ error: 'Invalid platform feature visibility' }, { status: 400 })
    }
    const toggleKey = getPlatformFeatureKey(body.category, body.platform)
    await updateConfigSection(['settings', 'platformVisibility', toggleKey], body.visible)
    return GET()
  }

  const key = platformVisibilityKeys.find((item) => item === body.platform)
  if (!key) return NextResponse.json({ error: 'Invalid platform visibility' }, { status: 400 })
  await updateConfigSection(['settings', 'platformVisibility', key], body.visible)
  return GET()
}
