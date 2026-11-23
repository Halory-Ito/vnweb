import { NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'
import {
  DEFAULT_GAME_STATUS_PUSH_COLORS,
  GAME_STATUS_PUSH_STATES,
} from '@/lib/settings/game-status-sync'

import type { GameStatusPushState } from '@/types'

const path = ['settings', 'appearance', 'status', 'pushColors']
const isColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)

export async function GET() {
  const config = await readConfig()
  let values: unknown = config
  for (const key of path) {
    values =
      values && typeof values === 'object' ? (values as Record<string, unknown>)[key] : undefined
  }
  const colors = { ...DEFAULT_GAME_STATUS_PUSH_COLORS }
  if (values && typeof values === 'object') {
    for (const state of GAME_STATUS_PUSH_STATES) {
      const color = (values as Record<string, unknown>)[state]
      if (isColor(color)) colors[state] = color
    }
  }
  return NextResponse.json(colors)
}

export async function PATCH(request: Request) {
  const payload: unknown = await request.json().catch(() => null)
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('state' in payload) ||
    !('color' in payload) ||
    !GAME_STATUS_PUSH_STATES.includes(payload.state as GameStatusPushState) ||
    !isColor(payload.color)
  ) {
    return NextResponse.json({ error: 'Invalid indicator color' }, { status: 400 })
  }
  await updateConfigSection([...path, payload.state as GameStatusPushState], payload.color)
  return new Response(null, { status: 204 })
}
