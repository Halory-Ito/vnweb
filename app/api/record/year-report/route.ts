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

const getYearReport = async (req: NextRequest) => {
  try {
    const offset = parseOffset(req.nextUrl.searchParams.get('offset'))
    const start = dayjs().add(offset, 'year').startOf('year')
    const end = start.endOf('year')

    const records = await db
      .select({
        gameId: GameRecordTable.gameId,
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)

    const monthSeconds = new Map<number, number>()
    const monthActiveDaySet = new Map<number, Set<string>>()
    const gameSeconds = new Map<number, number>()

    for (let month = 1; month <= 12; month += 1) {
      monthSeconds.set(month, 0)
      monthActiveDaySet.set(month, new Set<string>())
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
      if (seconds <= 0) {
        continue
      }

      const month = date.month() + 1
      monthSeconds.set(month, (monthSeconds.get(month) || 0) + seconds)
      monthActiveDaySet.get(month)?.add(date.format('YYYY-MM-DD'))

      const gameId = Number(item.gameId || 0)
      if (gameId > 0) {
        gameSeconds.set(gameId, (gameSeconds.get(gameId) || 0) + seconds)
      }
    }

    const gameRows = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        cover: GameInfoTable.cover,
        gameType: GameInfoTable.gameType,
        publisher: GameInfoTable.publisher,
      })
      .from(GameInfoTable)

    const gameMap = new Map(gameRows.map((item) => [Number(item.id), item]))

    const typeBucket = new Map<string, number>()
    const publisherBucket = new Map<string, number>()

    for (const [gameId, seconds] of gameSeconds) {
      const game = gameMap.get(gameId)
      if (!game) {
        continue
      }

      const typeKey = (game.gameType || '').trim() || '未知类型'
      const publisherKey = (game.publisher || '').trim() || '未知发行商'

      typeBucket.set(typeKey, (typeBucket.get(typeKey) || 0) + seconds)
      publisherBucket.set(
        publisherKey,
        (publisherBucket.get(publisherKey) || 0) + seconds,
      )
    }

    const monthlyStats = Array.from({ length: 12 }).map((_, index) => {
      const month = index + 1
      const seconds = monthSeconds.get(month) || 0
      return {
        month,
        label: `${month}月`,
        hours: toHours(seconds),
        activeDays: monthActiveDaySet.get(month)?.size || 0,
      }
    })

    const toDistribution = (bucket: Map<string, number>) =>
      Array.from(bucket.entries())
        .map(([key, seconds]) => ({
          key,
          label: key,
          seconds,
          hours: toHours(seconds),
        }))
        .sort((a, b) => b.seconds - a.seconds)

    const gameRank = Array.from(gameSeconds.entries())
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
        yearLabel: `${start.format('YYYY年')}`,
        monthlyStats,
        distributionByType: toDistribution(typeBucket),
        distributionByPublisher: toDistribution(publisherBucket),
        gameRank,
      },
    })
  } catch (error) {
    console.error('Get year report failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch year report' },
      { status: 500 },
    )
  }
}

export { getYearReport as GET }
