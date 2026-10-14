import dayjs from 'dayjs'
import { eq, max } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameGuideTable, GuideRouteTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

// 新增路线，需指定所属攻略
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guideId, name } = body as { guideId?: number | string; name?: string }

    const parsedGuideId = Number(guideId)

    if (!Number.isInteger(parsedGuideId) || parsedGuideId <= 0) {
      return NextResponse.json({ error: 'Missing guideId' }, { status: 400 })
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Missing route name' }, { status: 400 })
    }

    const guides = await db
      .select({ id: GameGuideTable.id })
      .from(GameGuideTable)
      .where(eq(GameGuideTable.id, parsedGuideId))

    if (guides.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
    }

    // 排序号接在该攻略现有路线之后
    const [orderResult] = await db
      .select({ value: max(GuideRouteTable.sortOrder) })
      .from(GuideRouteTable)
      .where(eq(GuideRouteTable.guideId, parsedGuideId))

    const now = dayjs().toISOString()
    const [route] = await db
      .insert(GuideRouteTable)
      .values({
        guideId: parsedGuideId,
        name: name.trim(),
        sortOrder: (orderResult?.value ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return NextResponse.json({ success: true, id: String(route.id) })
  } catch (error) {
    console.error('Create route error:', error)
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 })
  }
}
