import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  GameIdMapTable,
  GameInfoTable,
  ScanErrorTable,
  ScannerTable,
  relateWebsiteTable,
} from '@/db/schema'
import { db } from '@/lib/drizzle'
import { localizeGameImageFields } from '@/lib/server/game-image-storage'
import { BGMClient, SGDBClient } from '@/lib/vndb-client'
import { mapBGMSubjectToGameInfo } from '@/lib/vndb-utils'

import type { GameInfo } from '@/types/game-types'

type BGMSubject = {
  id?: number
}

type BGMSearchResponse = {
  data?: BGMSubject[]
}

type SGDBGame = {
  id?: number
  name?: string
  release_date?: number
}

type SGDBImage = {
  url?: string | URL
}

const parseExcludeDirs = (value: string | null) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const toSGDBGameInfo = (game?: SGDBGame, grids: SGDBImage[] = []): GameInfo => {
  const rawCover = grids[0]?.url
  const cover =
    typeof rawCover === 'string' ? rawCover : rawCover?.toString() || ''
  const releaseDate =
    typeof game?.release_date === 'number' && game.release_date > 0
      ? new Date(game.release_date * 1000).toISOString().slice(0, 10)
      : ''

  return {
    date: releaseDate,
    cover,
    summary: '',
    name: game?.name ?? '',
    nameCn: game?.name ?? '',
    tags: [],
    nsfw: false,
    ailases: [],
    platforms: [],
    gameType: '',
    gameEngine: '',
    websites: [],
    links: [],
    music: '',
    script: '',
    graphic: '',
    originalPainter: '',
    animationProduction: '',
    developer: '',
    publisher: '',
    programmer: '',
  }
}

const collectDirectoriesByLevel = async (
  root: string,
  level: number,
  excludes: string[],
) => {
  const targetDepth = level + 1
  const queue: Array<{ dir: string; depth: number }> = [
    {
      dir: root,
      depth: 0,
    },
  ]
  const names: string[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    const entries = await fs.readdir(current.dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const fullPath = path.join(current.dir, entry.name)
      if (excludes.includes(entry.name) || excludes.includes(fullPath)) {
        continue
      }

      const nextDepth = current.depth + 1
      if (nextDepth === targetDepth) {
        names.push(entry.name)
        continue
      }

      if (nextDepth < targetDepth) {
        queue.push({ dir: fullPath, depth: nextDepth })
      }
    }
  }

  return names
}

const collectDirectoriesByExe = async (root: string, excludes: string[]) => {
  const stack = [root]
  const names: string[] = []

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) {
      continue
    }

    const entries = await fs.readdir(current, { withFileTypes: true })

    const containsExe = entries.some(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === '.exe',
    )

    if (containsExe) {
      names.push(path.basename(current))
      continue
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const fullPath = path.join(current, entry.name)
      if (excludes.includes(entry.name) || excludes.includes(fullPath)) {
        continue
      }

      stack.push(fullPath)
    }
  }

  return names
}

const searchByProvider = async (provider: string, keyword: string) => {
  if (provider === 'bangumi') {
    const response = await BGMClient.request({
      method: 'POST',
      url: '/v0/search/subjects',
      data: {
        keyword,
        filter: {
          type: [4],
        },
      },
      params: {
        offset: 0,
        limit: 1,
      },
    })

    const payload = response.data as BGMSearchResponse
    return payload.data?.[0]?.id ? String(payload.data[0].id) : null
  }

  if (provider === 'steamgriddb') {
    const games = await SGDBClient.searchGame(keyword)
    const first = games[0] as { id?: number } | undefined
    return first?.id ? String(first.id) : null
  }

  throw new Error(`暂不支持数据源: ${provider}`)
}

const fetchGameInfoByProvider = async (provider: string, id: string) => {
  if (provider === 'bangumi') {
    const response = await BGMClient.request({
      method: 'GET',
      url: `/v0/subjects/${id}`,
    })
    return mapBGMSubjectToGameInfo(response.data as never)
  }

  if (provider === 'steamgriddb') {
    const gameId = Number(id)
    const game = (await SGDBClient.getGameById(gameId)) as SGDBGame
    const grids = (await SGDBClient.getGridsById(
      gameId,
    )) as unknown as SGDBImage[]
    return toSGDBGameInfo(game, grids)
  }

  return null
}

const saveGameInfo = async (
  gameInfo: GameInfo,
  provider?: string,
  externalId?: string,
) => {
  const uniqueName = (gameInfo.nameCn || gameInfo.name || '').trim()
  if (!uniqueName) {
    return false
  }

  const existsByName = await db
    .select({ id: GameInfoTable.id })
    .from(GameInfoTable)
    .where(eq(GameInfoTable.name, uniqueName))
    .limit(1)

  if (existsByName[0]) {
    return false
  }

  const existsByNameCn = await db
    .select({ id: GameInfoTable.id })
    .from(GameInfoTable)
    .where(eq(GameInfoTable.nameCn, uniqueName))
    .limit(1)

  if (existsByNameCn[0]) {
    return false
  }

  const now = dayjs().toISOString()
  const localizedImages = await localizeGameImageFields({
    gameName: gameInfo.nameCn || gameInfo.name || uniqueName,
    releaseDate: gameInfo.date,
    cover: gameInfo.cover || '',
  })

  const inserted = await db
    .insert(GameInfoTable)
    .values({
      date: gameInfo.date || '',
      cover: localizedImages.cover || gameInfo.cover || '',
      icon: '',
      logo: '',
      bg: '',
      summary: gameInfo.summary || '',
      name: gameInfo.name || uniqueName,
      nameCn: gameInfo.nameCn || gameInfo.name || uniqueName,
      tags: (gameInfo.tags || []).join(','),
      nsfw: gameInfo.nsfw ? 1 : 0,
      ailases: (gameInfo.ailases || []).join(','),
      platforms: (gameInfo.platforms || []).join(','),
      gameType: gameInfo.gameType || '',
      gameEngine: gameInfo.gameEngine || '',
      music: gameInfo.music || '',
      script: gameInfo.script || '',
      graphic: gameInfo.graphic || '',
      originalPainter: gameInfo.originalPainter || '',
      animationProduction: gameInfo.animationProduction || '',
      developer: gameInfo.developer || '',
      publisher: gameInfo.publisher || '',
      programmer: gameInfo.programmer || '',
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: GameInfoTable.id })

  const gameId = inserted[0]?.id
  if (!gameId) {
    return false
  }

  const normalizedProvider = (provider || '').trim()
  const normalizedExternalId = (externalId || '').trim()
  if (normalizedProvider && normalizedExternalId) {
    await db
      .insert(GameIdMapTable)
      .values({
        gameId,
        provider: normalizedProvider,
        externalId: normalizedExternalId,
      })
      .onConflictDoNothing({
        target: [
          GameIdMapTable.gameId,
          GameIdMapTable.provider,
          GameIdMapTable.externalId,
        ],
      })
  }

  const websites = [...(gameInfo.websites || []), ...(gameInfo.links || [])]
    .map((item) => {
      const entries = Object.entries(item)
      if (entries.length === 0) {
        return null
      }
      const [name, url] = entries[0]
      if (!name || !url) {
        return null
      }
      return {
        gameId,
        name,
        url,
      }
    })
    .filter(
      (item): item is { gameId: number; name: string; url: string } =>
        item !== null,
    )

  if (websites.length > 0) {
    await db.insert(relateWebsiteTable).values(websites)
  }

  return true
}

const startScan = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const scannerId = Number(id)

    if (!Number.isInteger(scannerId) || scannerId <= 0) {
      return NextResponse.json({ error: 'Invalid scanner id' }, { status: 400 })
    }

    const rows = await db
      .select({
        id: ScannerTable.id,
        directory: ScannerTable.directory,
        provider: ScannerTable.provider,
        scanMode: ScannerTable.scanMode,
        scanLevel: ScannerTable.scanLevel,
        excludeDirs: ScannerTable.excludeDirs,
      })
      .from(ScannerTable)
      .where(eq(ScannerTable.id, scannerId))
      .limit(1)

    const scanner = rows[0]
    if (!scanner) {
      return NextResponse.json({ error: '扫描目录不存在' }, { status: 404 })
    }

    if (!['bangumi', 'steamgriddb'].includes(scanner.provider)) {
      return NextResponse.json(
        { error: `当前暂不支持数据源 ${scanner.provider} 的自动扫描` },
        { status: 400 },
      )
    }

    const excludes = parseExcludeDirs(scanner.excludeDirs)
    const now = dayjs().toISOString()

    await fs.access(scanner.directory)

    const candidates =
      scanner.scanMode === 0
        ? await collectDirectoriesByLevel(
            scanner.directory,
            Math.max(0, scanner.scanLevel || 0),
            excludes,
          )
        : await collectDirectoriesByExe(scanner.directory, excludes)

    const uniqueCandidates = Array.from(
      new Set(candidates.map((item) => item.trim()).filter(Boolean)),
    )

    const totalCount = uniqueCandidates.length
    let matchedCount = 0
    let addedCount = 0
    let processed = 0

    await db
      .update(ScannerTable)
      .set({
        progress: totalCount === 0 ? 100 : 0,
        gameCount: totalCount,
        updatedAt: dayjs().toISOString(),
      })
      .where(eq(ScannerTable.id, scannerId))

    for (const name of uniqueCandidates) {
      try {
        const matchedId = await searchByProvider(scanner.provider, name)
        if (matchedId) {
          matchedCount += 1
          const gameInfo = await fetchGameInfoByProvider(
            scanner.provider,
            matchedId,
          )
          if (gameInfo) {
            const inserted = await saveGameInfo(
              gameInfo,
              scanner.provider,
              matchedId,
            )
            if (inserted) {
              addedCount += 1
            }
          }
        }
      } catch (error) {
        await db.insert(ScanErrorTable).values({
          directory: scanner.directory,
          error: `${name}: ${(error as Error).message}`,
          status: 0,
          createdAt: now,
          updatedAt: now,
        })
      }

      processed += 1
      const progress =
        uniqueCandidates.length === 0
          ? 100
          : Math.min(
              100,
              Math.floor((processed / uniqueCandidates.length) * 100),
            )

      await db
        .update(ScannerTable)
        .set({
          progress,
          gameCount: totalCount,
          updatedAt: dayjs().toISOString(),
        })
        .where(eq(ScannerTable.id, scannerId))
    }

    if (uniqueCandidates.length === 0) {
      await db
        .update(ScannerTable)
        .set({
          progress: 100,
          gameCount: 0,
          updatedAt: dayjs().toISOString(),
        })
        .where(eq(ScannerTable.id, scannerId))
    }

    return NextResponse.json({
      data: {
        scannerId,
        scannedCount: totalCount,
        matchedCount,
        addedCount,
      },
    })
  } catch (error) {
    console.error('Start scanner failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to start scan' },
      { status: 500 },
    )
  }
}

export { startScan as POST }
