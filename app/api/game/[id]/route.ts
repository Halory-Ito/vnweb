import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'

import {
  GameInfoTable,
  GamePlayTable,
  GameRecordTable,
  relateWebsiteTable,
} from '@/db/schema'
import { db } from '@/lib/drizzle'
import { localizeGameImageFieldsInBackground } from '@/lib/server/game-image-storage'

const parseCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const normalizeText = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const normalizeStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const normalizeWindowsPathInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const withBackslash = trimmed.replace(/\//g, '\\')
  return path.win32.normalize(withBackslash)
}

const getGameById = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const gameId = Number(id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const gameRows = await db
      .select()
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    const game = gameRows[0]
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const websites = await db
      .select({
        id: relateWebsiteTable.id,
        name: relateWebsiteTable.name,
        url: relateWebsiteTable.url,
      })
      .from(relateWebsiteTable)
      .where(eq(relateWebsiteTable.gameId, gameId))

    const playRows = await db
      .select({
        id: GamePlayTable.id,
        totalPlayTime: GamePlayTable.totalPlayTime,
        playCount: GamePlayTable.playCount,
        rating: GamePlayTable.rating,
        lastLaunchedAt: GamePlayTable.lastLaunchedAt,
        status: GamePlayTable.status,
        isRunning: GamePlayTable.isRunning,
        exePath: GamePlayTable.exePath,
      })
      .from(GamePlayTable)
      .where(eq(GamePlayTable.gameId, gameId))
      .limit(1)

    const playData = playRows[0]

    return NextResponse.json({
      data: {
        id: game.id,
        date: game.date,
        cover: game.cover,
        icon: game.icon,
        logo: game.logo,
        bg: game.bg,
        summary: game.summary,
        name: game.name,
        nameCn: game.nameCn,
        tags: parseCsv(game.tags),
        nsfw: game.nsfw === 1,
        ailases: parseCsv(game.ailases),
        platforms: parseCsv(game.platforms),
        gameType: game.gameType,
        gameEngine: game.gameEngine,
        music: game.music,
        script: game.script,
        graphic: game.graphic,
        originalPainter: game.originalPainter,
        animationProduction: game.animationProduction,
        developer: game.developer,
        publisher: game.publisher,
        programmer: game.programmer,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        websites,
        exePath: playData?.exePath ?? '',
        totalPlayTime: playData?.totalPlayTime ?? 0,
        playCount: playData?.playCount ?? 0,
        rating: playData?.rating ?? 0,
        lastLaunchedAt: playData?.lastLaunchedAt ?? '',
        playStatus: playData?.status ?? 0,
        isRunning: (playData?.isRunning ?? 0) === 1,
        currentSessionSeconds: 0,
      },
    })
  } catch (error) {
    console.error('Get game by id failed:', error)
    return NextResponse.json(
      { error: 'Failed to query game info' },
      { status: 500 },
    )
  }
}

const updateGame = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const gameId = Number(id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const payload = (await req.json().catch(() => ({}))) as {
      status?: number
      rating?: number
      exePath?: string
      cover?: string
      bg?: string
      icon?: string
      logo?: string
      date?: string
      summary?: string
      name?: string
      nameCn?: string
      tags?: string[] | string
      nsfw?: boolean | number
      ailases?: string[] | string
      platforms?: string[] | string
      gameType?: string
      gameEngine?: string
      music?: string
      script?: string
      graphic?: string
      originalPainter?: string
      animationProduction?: string
      developer?: string
      publisher?: string
      programmer?: string
    }

    const gameRows = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        date: GameInfoTable.date,
      })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (!gameRows[0]) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const hasSettingsPayload =
      payload.exePath !== undefined ||
      payload.cover !== undefined ||
      payload.bg !== undefined ||
      payload.icon !== undefined ||
      payload.logo !== undefined

    const hasBasicInfoPayload =
      payload.date !== undefined ||
      payload.summary !== undefined ||
      payload.name !== undefined ||
      payload.nameCn !== undefined ||
      payload.tags !== undefined ||
      payload.nsfw !== undefined ||
      payload.ailases !== undefined ||
      payload.platforms !== undefined ||
      payload.gameType !== undefined ||
      payload.gameEngine !== undefined ||
      payload.music !== undefined ||
      payload.script !== undefined ||
      payload.graphic !== undefined ||
      payload.originalPainter !== undefined ||
      payload.animationProduction !== undefined ||
      payload.developer !== undefined ||
      payload.publisher !== undefined ||
      payload.programmer !== undefined

    const hasRatingPayload = payload.rating !== undefined

    if (hasSettingsPayload || hasBasicInfoPayload) {
      const now = new Date().toISOString()
      const currentGame = gameRows[0]

      const localizedImages = localizeGameImageFieldsInBackground({
        gameName:
          normalizeText(payload.nameCn ?? '') ||
          normalizeText(payload.name ?? '') ||
          currentGame.nameCn ||
          currentGame.name ||
          `game_${gameId}`,
        releaseDate:
          normalizeText(payload.date ?? '') || currentGame.date || undefined,
        cover:
          payload.cover !== undefined
            ? normalizeText(payload.cover)
            : undefined,
        bg: payload.bg !== undefined ? normalizeText(payload.bg) : undefined,
        icon:
          payload.icon !== undefined ? normalizeText(payload.icon) : undefined,
        logo:
          payload.logo !== undefined ? normalizeText(payload.logo) : undefined,
      })

      const gamePatch: Partial<{
        date: string
        cover: string
        summary: string
        name: string
        nameCn: string
        tags: string
        nsfw: number
        ailases: string
        platforms: string
        gameType: string
        gameEngine: string
        music: string
        script: string
        graphic: string
        originalPainter: string
        animationProduction: string
        developer: string
        publisher: string
        programmer: string
        bg: string
        icon: string
        logo: string
        updatedAt: string
      }> = {
        updatedAt: now,
      }

      if (payload.cover !== undefined) {
        gamePatch.cover = localizedImages.cover || normalizeText(payload.cover)
      }
      if (payload.summary !== undefined) {
        gamePatch.summary = normalizeText(payload.summary)
      }
      if (payload.name !== undefined) {
        gamePatch.name = normalizeText(payload.name)
      }
      if (payload.nameCn !== undefined) {
        gamePatch.nameCn = normalizeText(payload.nameCn)
      }
      if (payload.date !== undefined) {
        gamePatch.date = normalizeText(payload.date)
      }
      if (payload.tags !== undefined) {
        gamePatch.tags = normalizeStringList(payload.tags).join(',')
      }
      if (payload.nsfw !== undefined) {
        gamePatch.nsfw = payload.nsfw ? 1 : 0
      }
      if (payload.ailases !== undefined) {
        gamePatch.ailases = normalizeStringList(payload.ailases).join(',')
      }
      if (payload.platforms !== undefined) {
        gamePatch.platforms = normalizeStringList(payload.platforms).join(',')
      }
      if (payload.gameType !== undefined) {
        gamePatch.gameType = normalizeText(payload.gameType)
      }
      if (payload.gameEngine !== undefined) {
        gamePatch.gameEngine = normalizeText(payload.gameEngine)
      }
      if (payload.music !== undefined) {
        gamePatch.music = normalizeText(payload.music)
      }
      if (payload.script !== undefined) {
        gamePatch.script = normalizeText(payload.script)
      }
      if (payload.graphic !== undefined) {
        gamePatch.graphic = normalizeText(payload.graphic)
      }
      if (payload.originalPainter !== undefined) {
        gamePatch.originalPainter = normalizeText(payload.originalPainter)
      }
      if (payload.animationProduction !== undefined) {
        gamePatch.animationProduction = normalizeText(
          payload.animationProduction,
        )
      }
      if (payload.developer !== undefined) {
        gamePatch.developer = normalizeText(payload.developer)
      }
      if (payload.publisher !== undefined) {
        gamePatch.publisher = normalizeText(payload.publisher)
      }
      if (payload.programmer !== undefined) {
        gamePatch.programmer = normalizeText(payload.programmer)
      }
      if (payload.bg !== undefined) {
        gamePatch.bg = localizedImages.bg || normalizeText(payload.bg)
      }
      if (payload.icon !== undefined) {
        gamePatch.icon = localizedImages.icon || normalizeText(payload.icon)
      }
      if (payload.logo !== undefined) {
        gamePatch.logo = localizedImages.logo || normalizeText(payload.logo)
      }

      await db
        .update(GameInfoTable)
        .set(gamePatch)
        .where(eq(GameInfoTable.id, gameId))

      if (payload.exePath !== undefined) {
        const nextExePath = normalizeWindowsPathInput(payload.exePath)
        const playRows = await db
          .select({ id: GamePlayTable.id })
          .from(GamePlayTable)
          .where(eq(GamePlayTable.gameId, gameId))
          .limit(1)

        const play = playRows[0]
        if (play) {
          await db
            .update(GamePlayTable)
            .set({ exePath: nextExePath })
            .where(eq(GamePlayTable.id, play.id))
        } else {
          await db.insert(GamePlayTable).values({
            gameId,
            exePath: nextExePath,
          })
        }
      }

      return NextResponse.json({
        data: {
          updated: true,
        },
      })
    }

    if (hasRatingPayload) {
      const nextRating = Number(payload.rating)
      if (!Number.isInteger(nextRating) || nextRating < 0 || nextRating > 10) {
        return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
      }

      const playRows = await db
        .select({
          id: GamePlayTable.id,
        })
        .from(GamePlayTable)
        .where(eq(GamePlayTable.gameId, gameId))
        .limit(1)

      const play = playRows[0]
      if (play) {
        await db
          .update(GamePlayTable)
          .set({
            rating: nextRating,
          })
          .where(eq(GamePlayTable.id, play.id))
      } else {
        await db.insert(GamePlayTable).values({
          gameId,
          rating: nextRating,
        })
      }

      return NextResponse.json({
        data: {
          rating: nextRating,
        },
      })
    }

    const nextStatus = Number(payload.status)
    if (!Number.isInteger(nextStatus) || nextStatus < 0 || nextStatus > 5) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const playRows = await db
      .select({
        id: GamePlayTable.id,
      })
      .from(GamePlayTable)
      .where(eq(GamePlayTable.gameId, gameId))
      .limit(1)

    const play = playRows[0]
    if (play) {
      await db
        .update(GamePlayTable)
        .set({
          status: nextStatus,
        })
        .where(eq(GamePlayTable.id, play.id))
    } else {
      await db.insert(GamePlayTable).values({
        gameId,
        status: nextStatus,
      })
    }

    return NextResponse.json({
      data: {
        status: nextStatus,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update play status' },
      { status: 500 },
    )
  }
}

const deleteGameById = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const gameId = Number(id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const gameRows = await db
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (!gameRows[0]) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    await db.delete(GamePlayTable).where(eq(GamePlayTable.gameId, gameId))
    await db.delete(GameRecordTable).where(eq(GameRecordTable.gameId, gameId))
    await db
      .delete(relateWebsiteTable)
      .where(eq(relateWebsiteTable.gameId, gameId))
    await db.delete(GameInfoTable).where(eq(GameInfoTable.id, gameId))

    return NextResponse.json({
      data: {
        deleted: true,
        id: gameId,
      },
    })
  } catch (error) {
    console.error('Delete game by id failed:', error)
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 },
    )
  }
}

export { getGameById as GET, updateGame as PATCH, deleteGameById as DELETE }
