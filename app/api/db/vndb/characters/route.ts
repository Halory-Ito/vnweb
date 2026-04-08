import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import { CharacterTable, GameIdMapTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { syncVndbCharactersByGameId } from '@/lib/server/vndb-character-sync'

const normalizeVnId = (rawId: string) => {
  const trimmed = rawId.trim()
  if (!trimmed) {
    return ''
  }
  if (/^v\d+$/i.test(trimmed)) {
    return `v${trimmed.slice(1)}`
  }
  if (/^\d+$/.test(trimmed)) {
    return `v${trimmed}`
  }
  return ''
}

const resolveBindingsByGameId = async (gameId: number) => {
  const idMaps = await db
    .select({
      provider: GameIdMapTable.provider,
      externalId: GameIdMapTable.externalId,
    })
    .from(GameIdMapTable)
    .where(eq(GameIdMapTable.gameId, gameId))

  const vndbBinding = idMaps.find(
    (item) => item.provider.trim().toLowerCase() === 'vndb',
  )
  const bangumiBinding = idMaps.find(
    (item) => item.provider.trim().toLowerCase() === 'bangumi',
  )

  const normalizeBangumiId = (rawId: string) => {
    const trimmed = rawId.trim()
    if (!trimmed) {
      return ''
    }

    const subjectMatch = trimmed.match(/subject\/(\d+)/i)
    if (subjectMatch?.[1]) {
      return subjectMatch[1]
    }

    if (/^\d+$/.test(trimmed)) {
      return trimmed
    }

    return ''
  }

  return {
    vnId: vndbBinding ? normalizeVnId(vndbBinding.externalId) : '',
    bgmSubjectId: bangumiBinding
      ? normalizeBangumiId(bangumiBinding.externalId)
      : '',
  }
}

const getCharactersByGameId = async (req: NextRequest) => {
  try {
    const gameIdParam = req.nextUrl.searchParams.get('gameId')
    const gameId = Number(gameIdParam)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const { vnId, bgmSubjectId } = await resolveBindingsByGameId(gameId)

    const cachedRows = await db
      .select({
        id: CharacterTable.vndbId,
        name: CharacterTable.name,
        original: CharacterTable.original,
        imageUrl: CharacterTable.imageUrl,
      })
      .from(CharacterTable)
      .where(eq(CharacterTable.gameId, gameId))
      .orderBy(CharacterTable.vndbId)

    const items = cachedRows.map((item) => ({
      id: item.id,
      name: item.name,
      original: item.original || '',
      imageUrl: item.imageUrl || '',
      role: '',
    }))

    return NextResponse.json({
      data: {
        vnId,
        bgmSubjectId,
        items,
        source: 'database',
      },
    })
  } catch (error) {
    console.error('VNDB characters fetch failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'VNDB characters fetch failed' },
      { status: 500 },
    )
  }
}

const syncCharactersToDb = async (req: NextRequest) => {
  try {
    const payload = (await req.json().catch(() => ({}))) as {
      gameId?: number
      source?: 'vndb' | 'bangumi' | 'both'
      mergeStrategy?:
        | 'prefer_vndb'
        | 'prefer_bangumi'
        | 'prefer_bangumi_with_vndb_fallback'
      saveImagesToLocal?: boolean
    }
    const gameId = Number(payload.gameId)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const result = await syncVndbCharactersByGameId(gameId, {
      source: payload.source,
      mergeStrategy: payload.mergeStrategy,
      saveImagesToLocal: payload.saveImagesToLocal,
    })
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('VNDB characters sync failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'VNDB characters sync failed' },
      { status: 500 },
    )
  }
}

const clearCharactersByGameId = async (req: NextRequest) => {
  try {
    const gameIdParam = req.nextUrl.searchParams.get('gameId')
    const gameId = Number(gameIdParam)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    await db.delete(CharacterTable).where(eq(CharacterTable.gameId, gameId))

    const localCharacterDir = path.join(
      process.cwd(),
      'public',
      'assets',
      'characters',
      String(gameId),
    )
    await fs.rm(localCharacterDir, { recursive: true, force: true })

    return NextResponse.json({
      data: {
        gameId,
        cleared: true,
      },
    })
  } catch (error) {
    console.error('Character clear failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Character clear failed' },
      { status: 500 },
    )
  }
}

export const GET = getCharactersByGameId
export const POST = syncCharactersToDb
export const DELETE = clearCharactersByGameId
