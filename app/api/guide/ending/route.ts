import dayjs from 'dayjs'
import { eq, max } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GuideEndingTable, GuideRouteTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

// 新增结局，需指定所属路线
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { routeId, name, type } = body as {
      routeId?: number | string
      name?: string
      type?: string
    }

    const parsedRouteId = Number(routeId)

    if (!Number.isInteger(parsedRouteId) || parsedRouteId <= 0) {
      return NextResponse.json({ error: 'Missing routeId' }, { status: 400 })
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Missing ending name' }, { status: 400 })
    }

    const routes = await db
      .select({ id: GuideRouteTable.id })
      .from(GuideRouteTable)
      .where(eq(GuideRouteTable.id, parsedRouteId))

    if (routes.length === 0) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    // 排序号接在该路线现有结局之后
    const [orderResult] = await db
      .select({ value: max(GuideEndingTable.sortOrder) })
      .from(GuideEndingTable)
      .where(eq(GuideEndingTable.routeId, parsedRouteId))

    const now = dayjs().toISOString()
    const [ending] = await db
      .insert(GuideEndingTable)
      .values({
        routeId: parsedRouteId,
        name: name.trim(),
        type: type?.trim() || 'normal',
        sortOrder: (orderResult?.value ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return NextResponse.json({ success: true, id: String(ending.id) })
  } catch (error) {
    console.error('Create ending error:', error)
    return NextResponse.json({ error: 'Failed to create ending' }, { status: 500 })
  }
}
