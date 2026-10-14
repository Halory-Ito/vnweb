import { asc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameGuideTable, GuideRouteTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

// 获取路线列表（可按 guideId 过滤），带攻略名称用于下拉消歧
export async function GET(request: NextRequest) {
  try {
    const guideIdParam = request.nextUrl.searchParams.get('guideId')
    const guideId = guideIdParam ? Number(guideIdParam) : null

    if (guideIdParam && (!Number.isInteger(guideId) || (guideId as number) <= 0)) {
      return NextResponse.json({ error: 'Invalid guideId' }, { status: 400 })
    }

    const rows = await db
      .select({
        id: GuideRouteTable.id,
        name: GuideRouteTable.name,
        guideId: GuideRouteTable.guideId,
        guideName: GameGuideTable.name,
      })
      .from(GuideRouteTable)
      .innerJoin(GameGuideTable, eq(GuideRouteTable.guideId, GameGuideTable.id))
      .where(guideId ? eq(GuideRouteTable.guideId, guideId) : undefined)
      .orderBy(
        asc(GuideRouteTable.guideId),
        asc(GuideRouteTable.sortOrder),
        asc(GuideRouteTable.id),
      )

    return NextResponse.json(
      rows.map((row) => ({
        id: String(row.id),
        name: row.name,
        guideId: row.guideId,
        guideName: row.guideName,
      })),
    )
  } catch (error) {
    console.error('Fetch route options error:', error)
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 })
  }
}
