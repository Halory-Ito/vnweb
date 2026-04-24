import { desc, eq, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import {
  CollectionGameTable,
  CollectionTable,
  GameInfoTable,
  GamePlayTable,
} from '@/db/schema'
import { db } from '@/lib/drizzle'

import type { GameSidebarProps } from '@/types/game-types'

const DEFAULT_GAME_ICON = '/file.svg'

const normalizeText = (value: string | null | undefined) =>
  (value || '').trim().toLowerCase()

const includesText = (value: string | null | undefined, keyword: string) => {
  if (!keyword) {
    return true
  }
  return normalizeText(value).includes(normalizeText(keyword))
}

const parseCsv = (value: string | null | undefined) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const parseDate = (value: string | null | undefined) => {
  const date = new Date(value || '')
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

const matchesDateRange = (
  dateText: string,
  fromText: string,
  toText: string,
) => {
  if (!fromText && !toText) {
    return true
  }

  const targetDate = parseDate(dateText)
  if (!targetDate) {
    return false
  }

  if (fromText) {
    const fromDate = parseDate(fromText)
    if (!fromDate || targetDate.getTime() < fromDate.getTime()) {
      return false
    }
  }

  if (toText) {
    const toDate = parseDate(toText)
    if (!toDate) {
      return false
    }

    const endOfDay = new Date(toDate)
    endOfDay.setHours(23, 59, 59, 999)
    if (targetDate.getTime() > endOfDay.getTime()) {
      return false
    }
  }

  return true
}

const getSidebarData = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const search = (searchParams.get('search') || '').trim()
    const includeNsfw =
      (searchParams.get('includeNsfw') || 'true').trim().toLowerCase() !==
      'false'
    const releaseDateFrom = (searchParams.get('releaseDateFrom') || '').trim()
    const releaseDateTo = (searchParams.get('releaseDateTo') || '').trim()
    const playStatus = (searchParams.get('playStatus') || '').trim()
    const developer = (searchParams.get('developer') || '').trim()
    const publisher = (searchParams.get('publisher') || '').trim()
    const category = (searchParams.get('category') || '').trim()
    const platform = (searchParams.get('platform') || '').trim()
    const tags = (searchParams.get('tags') || '').trim()
    const originalPainter = (searchParams.get('originalPainter') || '').trim()
    const script = (searchParams.get('script') || '').trim()
    const music = (searchParams.get('music') || '').trim()
    const engine = (searchParams.get('engine') || '').trim()
    const planning = (searchParams.get('planning') || '').trim()

    const allGames = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        icon: GameInfoTable.icon,
        date: GameInfoTable.date,
        developer: GameInfoTable.developer,
        publisher: GameInfoTable.publisher,
        gameType: GameInfoTable.gameType,
        platforms: GameInfoTable.platforms,
        tags: GameInfoTable.tags,
        originalPainter: GameInfoTable.originalPainter,
        script: GameInfoTable.script,
        music: GameInfoTable.music,
        gameEngine: GameInfoTable.gameEngine,
        programmer: GameInfoTable.programmer,
        nsfw: GameInfoTable.nsfw,
        playStatus: GamePlayTable.status,
      })
      .from(GameInfoTable)
      .leftJoin(GamePlayTable, eq(GamePlayTable.gameId, GameInfoTable.id))
      .orderBy(desc(GameInfoTable.id))

    const filteredGames = allGames.filter((game) => {
      const title = game.nameCn || game.name
      const statusValue = Number(game.playStatus ?? 0)

      if (
        search &&
        !includesText(title, search) &&
        !includesText(game.name, search)
      ) {
        return false
      }

      if (!includeNsfw && Number(game.nsfw ?? 0) === 1) {
        return false
      }

      if (!matchesDateRange(game.date, releaseDateFrom, releaseDateTo)) {
        return false
      }

      if (playStatus && Number(playStatus) !== statusValue) {
        return false
      }

      if (!includesText(game.developer, developer)) {
        return false
      }

      if (!includesText(game.publisher, publisher)) {
        return false
      }

      if (!includesText(game.gameType, category)) {
        return false
      }

      if (platform) {
        const platforms = parseCsv(game.platforms)
        if (!platforms.some((item) => includesText(item, platform))) {
          return false
        }
      }

      if (tags) {
        const tagList = parseCsv(game.tags)
        if (!tagList.some((item) => includesText(item, tags))) {
          return false
        }
      }

      if (!includesText(game.originalPainter, originalPainter)) {
        return false
      }

      if (!includesText(game.script, script)) {
        return false
      }

      if (!includesText(game.music, music)) {
        return false
      }

      if (!includesText(game.gameEngine, engine)) {
        return false
      }

      if (!includesText(game.programmer, planning)) {
        return false
      }

      return true
    })

    const filteredGameIdSet = new Set(filteredGames.map((item) => item.id))

    if (search) {
      const searchItems: GameSidebarProps[] = [
        {
          id: 'search-results',
          title: '搜索结果',
          items: filteredGames.map((game) => ({
            id: String(game.id),
            title: game.nameCn || game.name,
            icon: game.icon?.trim() ? game.icon : DEFAULT_GAME_ICON,
          })),
        },
      ]

      return NextResponse.json({
        data: {
          mode: 'search',
          items: searchItems,
        },
      })
    }

    const collections = await db
      .select({
        id: CollectionTable.id,
        name: CollectionTable.name,
      })
      .from(CollectionTable)
      .orderBy(desc(CollectionTable.id))

    const collectionGameRows = await db
      .select({
        collectionId: CollectionGameTable.collectionId,
        gameId: GameInfoTable.id,
        gameName: GameInfoTable.name,
        gameNameCn: GameInfoTable.nameCn,
        gameIcon: GameInfoTable.icon,
      })
      .from(CollectionGameTable)
      .innerJoin(
        GameInfoTable,
        eq(CollectionGameTable.gameId, GameInfoTable.id),
      )
      .orderBy(desc(CollectionGameTable.id))

    const collectionGameMap = new Map<
      number,
      Array<{ id: string; title: string; icon: string }>
    >()

    for (const row of collectionGameRows) {
      if (!filteredGameIdSet.has(row.gameId)) {
        continue
      }

      const current = collectionGameMap.get(row.collectionId) ?? []
      current.push({
        id: String(row.gameId),
        title: row.gameNameCn || row.gameName,
        icon: row.gameIcon?.trim() ? row.gameIcon : DEFAULT_GAME_ICON,
      })
      collectionGameMap.set(row.collectionId, current)
    }

    // 查询最近运行过的游戏（lastLaunchedAt 不为空且不为空字符串）
    const recentGameRows = await db
      .select({
        gameId: GamePlayTable.gameId,
        lastLaunchedAt: GamePlayTable.lastLaunchedAt,
        gameName: GameInfoTable.name,
        gameNameCn: GameInfoTable.nameCn,
        gameIcon: GameInfoTable.icon,
      })
      .from(GamePlayTable)
      .innerJoin(GameInfoTable, eq(GamePlayTable.gameId, GameInfoTable.id))
      .where(
        sql`${GamePlayTable.lastLaunchedAt} IS NOT NULL AND ${GamePlayTable.lastLaunchedAt} != ''`,
      )
      .orderBy(desc(GamePlayTable.lastLaunchedAt))
      .limit(10)

    const recentGameItems: Array<{ id: string; title: string; icon: string }> =
      recentGameRows
        .filter((game) => filteredGameIdSet.has(game.gameId))
        .map((game) => ({
          id: String(game.gameId),
          title: game.gameNameCn || game.gameName,
          icon: game.gameIcon?.trim() ? game.gameIcon : DEFAULT_GAME_ICON,
        }))

    const items: GameSidebarProps[] = [
      {
        id: 'recent',
        title: '最近游戏',
        items: recentGameItems,
      },
      {
        id: 'all',
        title: '所有游戏',
        items: filteredGames.map((game) => ({
          id: String(game.id),
          title: game.nameCn || game.name,
          icon: game.icon?.trim() ? game.icon : DEFAULT_GAME_ICON,
        })),
      },
      ...collections.map((collection) => ({
        id: `collection-${collection.id}`,
        title: collection.name,
        items: collectionGameMap.get(collection.id) ?? [],
      })),
    ]

    return NextResponse.json({
      data: {
        mode: 'default',
        items,
      },
    })
  } catch (error) {
    console.error('Get sidebar data failed:', error)
    return NextResponse.json(
      { error: 'Failed to get sidebar data' },
      { status: 500 },
    )
  }
}

export { getSidebarData as GET }
