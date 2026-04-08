import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { fetchSteamAppDetails } from '@/app/api/game/steam-import/_shared'
import { GameIdMapTable, GameInfoTable, GamePvTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { getEnabledProxySettings } from '@/lib/proxy-settings'

const parseGameId = async (context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const gameId = Number(id)
  if (!Number.isInteger(gameId) || gameId <= 0) {
    throw new Error('Invalid game id')
  }
  return gameId
}

const normalizeSteamAppId = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : String(value ?? '')
  const numeric = Number(text)
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null
  }
  return numeric
}

const resolveSteamAppId = async (gameId: number, steamAppIdRaw: unknown) => {
  const steamAppId = normalizeSteamAppId(steamAppIdRaw)

  if (steamAppId) {
    return {
      steamAppId,
      shouldBind: true,
    }
  }

  const rows = await db
    .select({ externalId: GameIdMapTable.externalId })
    .from(GameIdMapTable)
    .where(
      and(
        eq(GameIdMapTable.gameId, gameId),
        eq(GameIdMapTable.provider, 'steam'),
      ),
    )
    .limit(1)

  const existedAppId = normalizeSteamAppId(rows[0]?.externalId)
  if (!existedAppId) {
    throw new Error('Steam appid is required')
  }

  return {
    steamAppId: existedAppId,
    shouldBind: false,
  }
}

const ensureGameExists = async (gameId: number) => {
  const rows = await db
    .select({ id: GameInfoTable.id })
    .from(GameInfoTable)
    .where(eq(GameInfoTable.id, gameId))
    .limit(1)

  if (!rows[0]) {
    throw new Error('Game not found')
  }
}

const syncSteamPvs = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const payload = (await req.json().catch(() => ({}))) as {
      steamAppId?: string | number
    }

    const { steamAppId, shouldBind } = await resolveSteamAppId(
      gameId,
      payload.steamAppId,
    )

    // 获取启用的代理配置
    const proxySettings = await getEnabledProxySettings()
    const details = await fetchSteamAppDetails(
      steamAppId,
      proxySettings ?? undefined,
    )
    if (!details) {
      return NextResponse.json(
        { error: '未能从 Steam 获取游戏详情，请稍后重试' },
        { status: 502 },
      )
    }

    const movies = details.movies ?? []
    const candidateRows = movies
      .map((movie, index) => {
        const url =
          movie.hls_h264?.trim() ||
          movie.dash_h264?.trim() ||
          movie.mp4?.max?.trim() ||
          movie.mp4?.['480']?.trim() ||
          movie.webm?.max?.trim() ||
          movie.webm?.['480']?.trim() ||
          ''

        if (!url) {
          return null
        }

        const rawName = (movie.name || '').trim()
        const name = rawName || `PV ${index + 1}`

        return {
          name,
          url,
        }
      })
      .filter((item): item is { name: string; url: string } => item !== null)

    if (shouldBind) {
      await db
        .delete(GameIdMapTable)
        .where(
          and(
            eq(GameIdMapTable.gameId, gameId),
            eq(GameIdMapTable.provider, 'steam'),
          ),
        )

      await db.insert(GameIdMapTable).values({
        gameId,
        provider: 'steam',
        externalId: String(steamAppId),
      })
    }

    if (candidateRows.length === 0) {
      return NextResponse.json({
        data: {
          gameId,
          steamAppId,
          total: 0,
          inserted: 0,
          skipped: 0,
        },
      })
    }

    const existed = await db
      .select({ url: GamePvTable.url })
      .from(GamePvTable)
      .where(eq(GamePvTable.gameId, gameId))

    const existedUrlSet = new Set(existed.map((item) => item.url.trim()))
    const now = new Date().toISOString()
    const rowsToInsert = candidateRows
      .filter((item) => !existedUrlSet.has(item.url))
      .map((item) => ({
        gameId,
        name: item.name,
        url: item.url,
        createdAt: now,
        updatedAt: now,
      }))

    if (rowsToInsert.length > 0) {
      await db.insert(GamePvTable).values(rowsToInsert)
    }

    return NextResponse.json({
      data: {
        gameId,
        steamAppId,
        total: candidateRows.length,
        inserted: rowsToInsert.length,
        skipped: candidateRows.length - rowsToInsert.length,
      },
    })
  } catch (error) {
    const message = (error as Error).message || 'Steam PV 同步失败'

    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    if (message === 'Steam appid is required') {
      return NextResponse.json(
        { error: '请提供有效的 Steam AppID（纯数字）' },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export { syncSteamPvs as POST }
