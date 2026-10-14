import { asc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameGuideTable, GuideEndingTable, GuideRouteTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

// 获取结局列表（可按 guideId 过滤），带路线与攻略名称用于下拉消歧
export async function GET(request: NextRequest) {
  try {
    const guideIdParam = request.nextUrl.searchParams.get('guideId')
    const guideId = guideIdParam ? Number(guideIdParam) : null

    if (guideIdParam && (!Number.isInteger(guideId) || (guideId as number) <= 0)) {
      return NextResponse.json({ error: 'Invalid guideId' }, { status: 400 })
    }

    const rows = await db
      .select({
        id: GuideEndingTable.id,
        name: GuideEndingTable.name,
        type: GuideEndingTable.type,
        routeId: GuideEndingTable.routeId,
        routeName: GuideRouteTable.name,
        guideId: GuideRouteTable.guideId,
        guideName: GameGuideTable.name,
      })
      .from(GuideEndingTable)
      .innerJoin(GuideRouteTable, eq(GuideEndingTable.routeId, GuideRouteTable.id))
      .innerJoin(GameGuideTable, eq(GuideRouteTable.guideId, GameGuideTable.id))
      .where(guideId ? eq(GuideRouteTable.guideId, guideId) : undefined)
      .orderBy(
        asc(GuideRouteTable.guideId),
        asc(GuideRouteTable.sortOrder),
        asc(GuideEndingTable.sortOrder),
        asc(GuideEndingTable.id),
      )

    return NextResponse.json(
      rows.map((row) => ({
        id: String(row.id),
        name: row.name,
        type: row.type,
        routeId: row.routeId,
        routeName: row.routeName,
        guideId: row.guideId,
        guideName: row.guideName,
      })),
    )
  } catch (error) {
    console.error('Fetch ending options error:', error)
    return NextResponse.json({ error: 'Failed to fetch endings' }, { status: 500 })
  }
}
