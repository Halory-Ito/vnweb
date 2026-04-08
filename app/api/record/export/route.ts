import dayjs from 'dayjs'
import { and, desc, gte, lte, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GamePlayTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const toHours = (seconds: number) => Number((seconds / 3600).toFixed(2))

const normalizeTags = (raw: string) =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const formatDate = (dateStr: string) => {
  if (!dateStr) return undefined
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return undefined
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`
}

interface GetRecordExportParams {
  year?: number
}

const getRecordExport = async (params: GetRecordExportParams = {}) => {
  try {
    const { year } = params

    // 构建日期范围
    let startDate: dayjs.Dayjs
    let endDate: dayjs.Dayjs

    if (year) {
      startDate = dayjs(`${year}-01-01`)
      endDate = dayjs(`${year}-12-31`)
    } else {
      // 如果没有指定年份，返回所有数据
      startDate = dayjs('1970-01-01')
      endDate = dayjs('2100-12-31')
    }

    // 获取游戏游玩记录
    const plays = await db
      .select({
        gameId: GamePlayTable.gameId,
        totalPlayTime: GamePlayTable.totalPlayTime,
        rating: GamePlayTable.rating,
        lastLaunchedAt: GamePlayTable.lastLaunchedAt,
      })
      .from(GamePlayTable)
      .orderBy(desc(GamePlayTable.totalPlayTime))

    // 获取游戏信息
    const games = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        cover: GameInfoTable.cover,
        tags: GameInfoTable.tags,
        date: GameInfoTable.date,
        platforms: GameInfoTable.platforms,
        developer: GameInfoTable.developer,
        publisher: GameInfoTable.publisher,
        gameType: GameInfoTable.gameType,
      })
      .from(GameInfoTable)

    // 获取指定年份的游戏记录
    const gameIds = plays.map((p) => Number(p.gameId)).filter(Boolean)

    let recordsQuery = db
      .select({
        gameId: GameRecordTable.gameId,
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)

    if (year && gameIds.length > 0) {
      recordsQuery = recordsQuery.where(
        and(
          sql`${GameRecordTable.gameId} IN (${sql.join(
            gameIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          gte(GameRecordTable.playDate, startDate.format('YYYY-MM-DD')),
          lte(GameRecordTable.playDate, endDate.format('YYYY-MM-DD')),
        ),
      ) as typeof recordsQuery
    } else if (gameIds.length > 0) {
      recordsQuery = recordsQuery.where(
        sql`${GameRecordTable.gameId} IN (${sql.join(
          gameIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      ) as typeof recordsQuery
    }

    const records = await recordsQuery

    // 按游戏分组记录
    const recordsByGame = new Map<number, typeof records>()
    for (const record of records) {
      const gameId = Number(record.gameId)
      if (!recordsByGame.has(gameId)) {
        recordsByGame.set(gameId, [])
      }
      recordsByGame.get(gameId)!.push(record)
    }

    const gameMap = new Map(games.map((item) => [Number(item.id), item]))

    // 计算该年份的总时长
    const totalSeconds = records.reduce(
      (sum, item) => sum + Math.max(0, Number(item.playTime || 0)),
      0,
    )

    // 计算游玩次数
    const totalPlayCount = records.length

    // 计算平均评分
    const ratings = plays
      .map((p) => p.rating)
      .filter((r): r is number => r !== null && r !== undefined && r > 0)
    const averageRating =
      ratings.length > 0
        ? Number(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
          )
        : 0

    // 获取最后游玩日期（只保留年月日）
    const sortedDates = records
      .map((r) => r.playDate)
      .filter(Boolean)
      .sort()
      .reverse()
    const lastPlayedDate = sortedDates[0]
      ? formatDate(sortedDates[0]) || ''
      : ''

    // 获取 top 游戏
    const gamePlayData = records.reduce((acc: Map<number, number>, record) => {
      const gameId = Number(record.gameId)
      acc.set(
        gameId,
        (acc.get(gameId) || 0) + Math.max(0, Number(record.playTime || 0)),
      )
      return acc
    }, new Map())

    const topGames = Array.from(gamePlayData.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([gameId, seconds]) => {
        const game = gameMap.get(gameId)
        if (!game) return null
        return {
          title: game.nameCn || game.name || `游戏 ${gameId}`,
          cover: game.cover || '/cover/wa2.jpg',
          playtime: toHours(seconds),
        }
      })
      .filter(Boolean)

    const entries = plays
      .map((item) => {
        const game = gameMap.get(Number(item.gameId))
        if (!game) {
          return null
        }

        const gameRecords = recordsByGame.get(Number(item.gameId)) || []

        // 计算该游戏在该年份的时长
        const seconds = gameRecords.reduce(
          (sum, r) => sum + Math.max(0, Number(r.playTime || 0)),
          0,
        )

        if (seconds <= 0) {
          return null
        }

        const ratio = totalSeconds > 0 ? seconds / totalSeconds : 0

        // 按日期分组计算每日游玩时长
        const dailyTimes = new Map<string, number>()
        for (const record of gameRecords) {
          const dateKey = formatDate(record.playDate || '')
          if (!dateKey || !record.playTime) continue
          dailyTimes.set(
            dateKey,
            (dailyTimes.get(dateKey) || 0) +
              Math.max(0, Number(record.playTime)),
          )
        }

        const dailyTimesList = Array.from(dailyTimes.values())

        // 第一次和最后一次游玩日期
        const sortedDates = Array.from(dailyTimes.keys()).sort()
        const firstPlayAt = sortedDates[0]
        const lastPlayAt = sortedDates[sortedDates.length - 1]

        // 单日最大游玩时长
        const maxDailySeconds =
          dailyTimesList.length > 0 ? Math.max(...dailyTimesList) : 0

        // 平均每日游玩时长
        const avgDailySeconds =
          dailyTimesList.length > 0
            ? dailyTimesList.reduce((a, b) => a + b, 0) / dailyTimesList.length
            : 0

        // 游戏评分
        const rating = item.rating ?? null

        return {
          id: String(game.id),
          title: game.nameCn || game.name || `游戏 ${game.id}`,
          cover: game.cover || '/cover/wa2.jpg',
          tags: normalizeTags(game.tags || '').slice(0, 5),
          totalPlaySeconds: seconds,
          totalPlayHours: toHours(seconds),
          ratio: Number((ratio * 100).toFixed(2)),
          firstPlayAt,
          lastPlayAt,
          maxDailySeconds,
          avgDailySeconds,
          rating,
          playCount: gameRecords.length,
          // 新增字段
          releaseDate: game.date || undefined,
          platforms: normalizeTags(game.platforms || ''),
          developer: game.developer || undefined,
          publisher: game.publisher || undefined,
          gameType: game.gameType || undefined,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.totalPlaySeconds - a.totalPlaySeconds)

    return NextResponse.json({
      data: {
        year: year || null,
        yearLabel: year ? `${year}年` : '全部时间',
        totalPlaySeconds: totalSeconds,
        totalPlayHours: toHours(totalSeconds),
        totalPlayCount,
        averageRating,
        lastPlayedDate,
        topGames,
        entries,
      },
    })
  } catch (error) {
    console.error('Get export report failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export report' },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get('year')
  const yearNum = year ? parseInt(year, 10) : undefined

  const data = await getRecordExport({ year: yearNum })
  return data
}
