import { inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameGuideTable, GuideEndingTable, GuideRouteTable, GuideStepTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

// 解析 ?ids=1,2,3，去重并过滤非法值
function parseGuideIds(request: NextRequest): number[] {
  const raw = request.nextUrl.searchParams.get('ids') ?? ''

  return [
    ...new Set(
      raw
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ]
}

// 删除攻略（支持批量）：按 步骤 → 结局 → 路线 → 攻略 的顺序自底向上清理
export async function DELETE(request: NextRequest) {
  try {
    const ids = parseGuideIds(request)

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Missing guide ids' }, { status: 400 })
    }

    let deleted = 0

    await db.transaction(async (tx) => {
      // 只处理真实存在的攻略，避免用无效 id 影响删除计数
      const guides = await tx
        .select({ id: GameGuideTable.id })
        .from(GameGuideTable)
        .where(inArray(GameGuideTable.id, ids))

      if (guides.length === 0) {
        return
      }

      const guideIds = guides.map((guide) => guide.id)

      const routes = await tx
        .select({ id: GuideRouteTable.id })
        .from(GuideRouteTable)
        .where(inArray(GuideRouteTable.guideId, guideIds))
      const routeIds = routes.map((route) => route.id)

      const endings = routeIds.length
        ? await tx
            .select({ id: GuideEndingTable.id })
            .from(GuideEndingTable)
            .where(inArray(GuideEndingTable.routeId, routeIds))
        : []
      const endingIds = endings.map((ending) => ending.id)

      if (endingIds.length) {
        await tx.delete(GuideStepTable).where(inArray(GuideStepTable.endingId, endingIds))
      }
      if (routeIds.length) {
        await tx.delete(GuideEndingTable).where(inArray(GuideEndingTable.routeId, routeIds))
      }
      await tx.delete(GuideRouteTable).where(inArray(GuideRouteTable.guideId, guideIds))
      await tx.delete(GameGuideTable).where(inArray(GameGuideTable.id, guideIds))

      deleted = guideIds.length
    })

    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    console.error('Delete guide error:', error)
    return NextResponse.json({ error: 'Failed to delete guide' }, { status: 500 })
  }
}
