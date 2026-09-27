import dayjs from 'dayjs'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, RecentVisitTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { RECENT_VISIT_TYPES, type RecentVisitType } from '@/types/recent-visit'

// 最多保留的记录条数，超出后按访问时间清理最旧的记录
const MAX_STORED_ITEMS = 60
const DEFAULT_LIMIT = 30

// 建表兜底：本项目 `drizzle-kit push` 因既有索引冲突无法执行，这里保证表存在
let tableReady: Promise<void> | null = null

function ensureRecentVisitTable() {
  if (!tableReady) {
    tableReady = db
      .run(sql`
        CREATE TABLE IF NOT EXISTS \`recent_visit\` (
          \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          \`gameId\` integer NOT NULL,
          \`type\` text NOT NULL,
          \`href\` text NOT NULL,
          \`visitedAt\` text DEFAULT ''
        )
      `)
      .then(() => undefined)
      .catch((error) => {
        tableReady = null
        throw error
      })
  }

  return tableReady
}

const normalizeType = (value: unknown): RecentVisitType | null => {
  if (typeof value !== 'string') {
    return null
  }
  return (RECENT_VISIT_TYPES as readonly string[]).includes(value)
    ? (value as RecentVisitType)
    : null
}

// 获取最近访问列表
async function getRecentVisits(req: NextRequest) {
  try {
    await ensureRecentVisitTable()

    const includeNsfw =
      (req.nextUrl.searchParams.get('includeNsfw') || 'true').trim().toLowerCase() !== 'false'
    const rawLimit = Number(req.nextUrl.searchParams.get('limit'))
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(100, Math.round(rawLimit))
        : DEFAULT_LIMIT

    const rows = await db
      .select({
        id: RecentVisitTable.id,
        gameId: RecentVisitTable.gameId,
        type: RecentVisitTable.type,
        href: RecentVisitTable.href,
        visitedAt: RecentVisitTable.visitedAt,
        gameName: GameInfoTable.name,
        gameNameCn: GameInfoTable.nameCn,
        gameCover: GameInfoTable.cover,
        nsfw: GameInfoTable.nsfw,
      })
      .from(RecentVisitTable)
      .innerJoin(GameInfoTable, eq(GameInfoTable.id, RecentVisitTable.gameId))
      .orderBy(desc(RecentVisitTable.visitedAt))
      .limit(limit)

    const items = rows
      .filter((row) => includeNsfw || row.nsfw !== 1)
      .map((row) => ({
        id: row.id,
        gameId: row.gameId,
        type: row.type as RecentVisitType,
        href: row.href,
        visitedAt: row.visitedAt || '',
        gameName: row.gameName,
        gameNameCn: row.gameNameCn,
        gameCover: row.gameCover || '',
      }))

    return NextResponse.json({ data: { items } })
  } catch (error) {
    console.error('Get recent visits failed:', error)
    return NextResponse.json({ error: '获取最近访问失败' }, { status: 500 })
  }
}

// 记录一次访问：同一游戏 + 同一入口类型只保留最新一条
async function recordRecentVisit(req: NextRequest) {
  try {
    await ensureRecentVisitTable()

    const body = (await req.json().catch(() => ({}))) as {
      gameId?: number | string
      type?: string
      href?: string
    }

    const gameId = Number(body.gameId)
    const type = normalizeType(body.type)
    const href = typeof body.href === 'string' ? body.href.trim() : ''

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 ID' }, { status: 400 })
    }
    if (!type) {
      return NextResponse.json({ error: '无效的入口类型' }, { status: 400 })
    }
    if (!href) {
      return NextResponse.json({ error: '缺少访问路径' }, { status: 400 })
    }

    const game = await db
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (game.length === 0) {
      return NextResponse.json({ error: '游戏不存在' }, { status: 404 })
    }

    await db
      .delete(RecentVisitTable)
      .where(and(eq(RecentVisitTable.gameId, gameId), eq(RecentVisitTable.type, type)))

    await db.insert(RecentVisitTable).values({
      gameId,
      type,
      href,
      visitedAt: dayjs().toISOString(),
    })

    const overflow = await db
      .select({ id: RecentVisitTable.id })
      .from(RecentVisitTable)
      .orderBy(desc(RecentVisitTable.visitedAt))
      .limit(MAX_STORED_ITEMS)
      .offset(MAX_STORED_ITEMS)

    if (overflow.length > 0) {
      await db.delete(RecentVisitTable).where(
        inArray(
          RecentVisitTable.id,
          overflow.map((row) => row.id),
        ),
      )
    }

    return NextResponse.json({ data: { ok: true } })
  } catch (error) {
    console.error('Record recent visit failed:', error)
    return NextResponse.json({ error: '记录访问失败' }, { status: 500 })
  }
}

// 清空最近访问
async function clearRecentVisits() {
  try {
    await ensureRecentVisitTable()

    await db.delete(RecentVisitTable)
    return NextResponse.json({ data: { ok: true } })
  } catch (error) {
    console.error('Clear recent visits failed:', error)
    return NextResponse.json({ error: '清空最近访问失败' }, { status: 500 })
  }
}

export { getRecentVisits as GET, recordRecentVisit as POST, clearRecentVisits as DELETE }
