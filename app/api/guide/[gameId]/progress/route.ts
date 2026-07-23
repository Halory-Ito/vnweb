import { eq, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/drizzle'
import {
  GameGuideTable,
  GuideRouteTable,
  GuideEndingTable,
  GuideStepTable,
} from '@/db/schema'

type ProgressType = 'step' | 'ending' | 'route' | 'guide'

const tableMap = {
  step: GuideStepTable,
  ending: GuideEndingTable,
  route: GuideRouteTable,
  guide: GameGuideTable,
} as const

async function updateFinished(table: typeof GuideStepTable | typeof GuideEndingTable | typeof GuideRouteTable | typeof GameGuideTable, ids: number[], finished: boolean) {
  if (ids.length === 0) return
  await db
    .update(table)
    .set({
      finished: finished ? 1 : 0,
      updatedAt: new Date().toISOString(),
    })
    .where(inArray(table.id, ids))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params

  if (!gameId) {
    return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({})) as {
      type?: ProgressType
      id?: number
      finished?: boolean
    }

    const { type, id, finished } = body

    if (!type || !id || finished === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: type, id, finished' },
        { status: 400 },
      )
    }

    if (!tableMap[type]) {
      return NextResponse.json(
        { error: 'Invalid type, must be one of: step, ending, route, guide' },
        { status: 400 },
      )
    }

    const table = tableMap[type]

    // 检查记录是否存在
    const existing = await db
      .select({ id: table.id })
      .from(table)
      .where(eq(table.id, id))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // 更新目标记录
    await db
      .update(table)
      .set({
        finished: finished ? 1 : 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(table.id, id))

    // 级联更新子级进度
    if (type === 'guide') {
      const routes = await db
        .select({ id: GuideRouteTable.id })
        .from(GuideRouteTable)
        .where(eq(GuideRouteTable.guideId, id))
      const routeIds = routes.map((r) => r.id)

      const endings = routeIds.length
        ? await db
            .select({ id: GuideEndingTable.id })
            .from(GuideEndingTable)
            .where(inArray(GuideEndingTable.routeId, routeIds))
        : []
      const endingIds = endings.map((e) => e.id)

      const steps = endingIds.length
        ? await db
            .select({ id: GuideStepTable.id })
            .from(GuideStepTable)
            .where(inArray(GuideStepTable.endingId, endingIds))
        : []
      const stepIds = steps.map((s) => s.id)

      await updateFinished(GuideRouteTable, routeIds, finished)
      await updateFinished(GuideEndingTable, endingIds, finished)
      await updateFinished(GuideStepTable, stepIds, finished)
    } else if (type === 'route') {
      const endings = await db
        .select({ id: GuideEndingTable.id })
        .from(GuideEndingTable)
        .where(eq(GuideEndingTable.routeId, id))
      const endingIds = endings.map((e) => e.id)

      const steps = endingIds.length
        ? await db
            .select({ id: GuideStepTable.id })
            .from(GuideStepTable)
            .where(inArray(GuideStepTable.endingId, endingIds))
        : []
      const stepIds = steps.map((s) => s.id)

      await updateFinished(GuideEndingTable, endingIds, finished)
      await updateFinished(GuideStepTable, stepIds, finished)
    } else if (type === 'ending') {
      const steps = await db
        .select({ id: GuideStepTable.id })
        .from(GuideStepTable)
        .where(eq(GuideStepTable.endingId, id))
      const stepIds = steps.map((s) => s.id)

      await updateFinished(GuideStepTable, stepIds, finished)
    }

    return NextResponse.json({ data: { updated: true, id } })
  } catch (error) {
    console.error('Update guide progress error:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 },
    )
  }
}
