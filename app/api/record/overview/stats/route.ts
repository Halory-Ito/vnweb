import dayjs from 'dayjs'
import { NextResponse } from 'next/server'

import {
  CharacterTable,
  GameInfoTable,
  GameOstTable,
  GamePlayTable,
  GamePvTable,
  GameQuoteTable,
  GameRecordTable,
} from '@/db/schema'
import { db } from '@/lib/drizzle'

const getOverviewStats = async () => {
  try {
    const games = await db.select({ id: GameInfoTable.id }).from(GameInfoTable)
    const [characters, osts, pvs, quotes] = await Promise.all([
      db.select({ id: CharacterTable.id }).from(CharacterTable),
      db.select({ id: GameOstTable.id }).from(GameOstTable),
      db.select({ id: GamePvTable.id }).from(GamePvTable),
      db.select({ id: GameQuoteTable.id }).from(GameQuoteTable),
    ])
    const plays = await db
      .select({
        gameId: GamePlayTable.gameId,
        totalPlayTime: GamePlayTable.totalPlayTime,
        playCount: GamePlayTable.playCount,
        rating: GamePlayTable.rating,
      })
      .from(GamePlayTable)

    const records = await db
      .select({
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)

    const totalPlaySeconds = plays.reduce(
      (sum, item) => sum + Math.max(0, Number(item.totalPlayTime || 0)),
      0,
    )
    const totalPlayTime = Number((totalPlaySeconds / 3600).toFixed(2))

    const totalPlayCount = plays.reduce(
      (sum, item) => sum + Math.max(0, Number(item.playCount || 0)),
      0,
    )

    const daySet = new Set(
      records
        .map((item) => {
          const d = dayjs(item.playDate || '')
          return d.isValid() ? d.format('YYYY-MM-DD') : ''
        })
        .filter(Boolean),
    )

    const now = dayjs()
    const currentYear = now.year()
    const monthBucket = new Map<string, number>()
    const hourBucket = new Map<number, number>()

    for (let i = 1; i <= 12; i += 1) {
      monthBucket.set(`${currentYear}-${String(i).padStart(2, '0')}`, 0)
    }
    for (let i = 0; i < 24; i += 1) {
      hourBucket.set(i, 0)
    }

    for (const item of records) {
      const playDate = dayjs(item.playDate || '')
      if (!playDate.isValid()) {
        continue
      }

      const durationSeconds = Math.max(0, Number(item.playTime || 0))

      if (playDate.year() === currentYear) {
        const monthKey = playDate.format('YYYY-MM')
        monthBucket.set(
          monthKey,
          (monthBucket.get(monthKey) || 0) + durationSeconds,
        )
      }

      const hour = playDate.hour()
      hourBucket.set(hour, (hourBucket.get(hour) || 0) + durationSeconds)
    }

    const monthlyDurationDistribution = Array.from(monthBucket.entries()).map(
      ([monthKey, seconds]) => ({
        label: dayjs(monthKey, 'YYYY-MM').format('M月'),
        hours: Number((seconds / 3600).toFixed(2)),
      }),
    )

    const hourlyTimeDistribution = Array.from(hourBucket.entries()).map(
      ([hour, seconds]) => ({
        label: `${String(hour).padStart(2, '0')}:00`,
        hours: Number((seconds / 3600).toFixed(2)),
      }),
    )

    const peakHour = hourlyTimeDistribution.reduce(
      (max, item, index) => {
        if (item.hours > max.hours) {
          return { index, hours: item.hours }
        }
        return max
      },
      { index: 0, hours: -1 },
    ).index

    const peakHourLabel = `${String(peakHour).padStart(2, '0')}:00 - ${String(
      (peakHour + 1) % 24,
    ).padStart(2, '0')}:00`

    const gameRows = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        cover: GameInfoTable.cover,
      })
      .from(GameInfoTable)

    const gameMap = new Map(gameRows.map((item) => [item.id, item]))

    const playTimeRank = plays
      .map((item) => {
        const game = gameMap.get(item.gameId)
        if (!game) {
          return null
        }

        return {
          id: String(game.id),
          cover: game.cover || '/cover/wa2.jpg',
          title: game.nameCn || game.name || `游戏 ${game.id}`,
          stat: Number(
            (Math.max(0, Number(item.totalPlayTime || 0)) / 3600).toFixed(2),
          ),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.stat - a.stat)

    const ratingRank = plays
      .map((item) => {
        const game = gameMap.get(item.gameId)
        if (!game) {
          return null
        }

        const rating = Math.max(0, Number(item.rating || 0))
        if (rating <= 0) {
          return null
        }

        return {
          id: String(game.id),
          cover: game.cover || '/cover/wa2.jpg',
          title: game.nameCn || game.name || `游戏 ${game.id}`,
          stat: Number(rating.toFixed(1)),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.stat - a.stat)

    return NextResponse.json({
      data: {
        totalGames: games.length,
        totalPlayTime,
        totalDays: daySet.size,
        totalPlayCount,
        totalCharacters: characters.length,
        totalOsts: osts.length,
        totalPvs: pvs.length,
        totalQuotes: quotes.length,
        monthlyDurationDistribution,
        hourlyTimeDistribution,
        peakHourLabel,
        playTimeRank,
        ratingRank,
      },
    })
  } catch (error) {
    console.error('Get overview stats failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview stats' },
      { status: 500 },
    )
  }
}

export { getOverviewStats as GET }
