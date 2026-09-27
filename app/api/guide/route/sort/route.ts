import { eq, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GuideRouteTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { routes } = body as { routes: { id: number; sortOrder: number }[] }

    if (!Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid routes array' }, { status: 400 })
    }

    // 验证所有路由 ID 存在
    const routeIds = routes.map((r) => r.id)
    const existingRoutes = await db
      .select({ id: GuideRouteTable.id })
      .from(GuideRouteTable)
      .where(inArray(GuideRouteTable.id, routeIds))

    if (existingRoutes.length !== routeIds.length) {
      return NextResponse.json({ error: 'Some routes not found' }, { status: 404 })
    }

    // 批量更新排序顺序
    const now = new Date().toISOString()
    for (const route of routes) {
      await db
        .update(GuideRouteTable)
        .set({
          sortOrder: route.sortOrder,
          updatedAt: now,
        })
        .where(eq(GuideRouteTable.id, route.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update route sort order error:', error)
    return NextResponse.json({ error: 'Failed to update route sort order' }, { status: 500 })
  }
}
