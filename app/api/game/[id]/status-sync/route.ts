import { NextResponse } from 'next/server'

import {
  bindGameStatusSyncEntry,
  readGameStatusSyncAvailability,
  syncSavedGameStatus,
} from '@/lib/server/game-status-sync'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gameId = Number((await context.params).id)
  if (!Number.isSafeInteger(gameId) || gameId <= 0) {
    return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })
  }
  return NextResponse.json(await readGameStatusSyncAvailability(gameId))
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const gameId = Number((await context.params).id)
  if (!Number.isSafeInteger(gameId) || gameId <= 0) {
    return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })
  }

  const payload: unknown = await request.json().catch(() => null)
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('provider' in payload) ||
    !('externalId' in payload) ||
    (payload.provider !== 'bangumi' && payload.provider !== 'vndb') ||
    typeof payload.externalId !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid platform entry' }, { status: 400 })
  }

  const result = await bindGameStatusSyncEntry(gameId, payload.provider, payload.externalId)
  if (result === 'invalid-entry')
    return NextResponse.json({ error: 'Invalid platform entry' }, { status: 400 })
  if (result === 'missing-game')
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  return new Response(null, { status: 204 })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gameId = Number((await context.params).id)
  if (!Number.isSafeInteger(gameId) || gameId <= 0) {
    return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })
  }

  const payload: unknown = await request.json().catch(() => null)
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('provider' in payload) ||
    !('status' in payload) ||
    (payload.provider !== 'bangumi' && payload.provider !== 'vndb') ||
    typeof payload.status !== 'number' ||
    !Number.isSafeInteger(payload.status)
  ) {
    return NextResponse.json({ error: 'Invalid status sync request' }, { status: 400 })
  }
  return NextResponse.json(await syncSavedGameStatus(gameId, payload.provider, payload.status))
}
