import dayjs from 'dayjs'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const parseOffset = (value: string | null): number => {
  const n = Number(value)
  if (!Number.isInteger(n)) {
    return 0
  }
  return Math.min(0, n)
}

const toHours = (seconds: number) => Number((seconds / 3600).toFixed(2))

const getMonthReport = async (req: NextRequest) => {
  try {
    const offset = parseOffset(req.nextUrl.searchParams.get('offset'))
    const start = dayjs().add(offset, 'month').startOf('month')
    const end = start.endOf('month')

    const records = await db
      .select({
        gameId: GameRecordTable.gameId,
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)

    const daySeconds = new Map<number, number>()
    const gameSeconds = new Map<number, number>()
    const gameFrequency = new Map<number, number>()

    const daysInMonth = start.daysInMonth()
    for (let day = 1; day <= daysInMonth; day += 1) {
      daySeconds.set(day, 0)
    }

    for (const item of records) {
      const date = dayjs(item.playDate || '')
      if (!date.isValid()) {
        continue
      }
      if (date.isBefore(start) || date.isAfter(end)) {
        continue
      }

      const seconds = Math.max(0, Number(item.playTime || 0))
      const day = date.date()
      daySeconds.set(day, (daySeconds.get(day) || 0) + seconds)

      const gameId = Number(item.gameId || 0)
      if (gameId <= 0) {
        continue
      }

      gameSeconds.set(gameId, (gameSeconds.get(gameId) || 0) + seconds)
      gameFrequency.set(gameId, (gameFrequency.get(gameId) || 0) + 1)
    }

    const gameRows = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        cover: GameInfoTable.cover,
      })
      .from(GameInfoTable)

    const gameMap = new Map(gameRows.map((item) => [Number(item.id), item]))

    const dailyStats = Array.from({ length: daysInMonth }).map((_, idx) => {
      const day = idx + 1
      const seconds = daySeconds.get(day) || 0
      return {
        day,
        label: String(day),
        seconds,
        hours: toHours(seconds),
      }
    })

    const frequencyItems = Array.from(gameFrequency.entries())
      .map(([gameId, count]) => {
        const game = gameMap.get(gameId)
        if (!game) {
          return null
        }

        return {
          key: String(gameId),
          label: game.nameCn || game.name || `游戏 ${gameId}`,
          count,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.count - a.count)

    const playTimeRank = Array.from(gameSeconds.entries())
      .map(([gameId, seconds]) => {
        const game = gameMap.get(gameId)
        if (!game) {
          return null
        }

        return {
          id: String(gameId),
          cover: game.cover || '/cover/wa2.jpg',
          title: game.nameCn || game.name || `游戏 ${gameId}`,
          stat: toHours(seconds),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.stat - a.stat)

    return NextResponse.json({
      data: {
        offset,
        monthLabel: start.format('YYYY年MM月'),
        dailyStats,
        gameFrequency: frequencyItems,
        playTimeRank,
      },
    })
  } catch (error) {
    console.error('Get month report failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch month report' },
      { status: 500 },
    )
  }
}

export { getMonthReport as GET }
