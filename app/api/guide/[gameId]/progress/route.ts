import { eq } from 'drizzle-orm'
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

    // 更新 finished 字段
    await db
      .update(table)
      .set({
        finished: finished ? 1 : 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(table.id, id))

    return NextResponse.json({ data: { updated: true, id } })
  } catch (error) {
    console.error('Update guide progress error:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 },
    )
  }
}
