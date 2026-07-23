import dayjs from 'dayjs'
import { eq, asc } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/drizzle'
import {
  GameGuideTable,
  GuideRouteTable,
  GuideEndingTable,
  GuideStepTable,
} from '@/db/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params

  if (!gameId) {
    return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
  }

  try {
    // 查询攻略主表
    const guides = await db
      .select()
      .from(GameGuideTable)
      .where(eq(GameGuideTable.gameId, Number(gameId)))

    if (guides.length === 0) {
      return NextResponse.json(null)
    }

    const guide = guides[0]

    // 查询路线（按 sortOrder 排序）
    const routes = await db
      .select()
      .from(GuideRouteTable)
      .where(eq(GuideRouteTable.guideId, guide.id))
      .orderBy(asc(GuideRouteTable.sortOrder))

    // 查询所有结局和步骤
    const routesWithDetails = await Promise.all(
      routes.map(async (route) => {
        const endings = await db
          .select()
          .from(GuideEndingTable)
          .where(eq(GuideEndingTable.routeId, route.id))

        const endingsWithSteps = await Promise.all(
          endings.map(async (ending) => {
            const steps = await db
              .select()
              .from(GuideStepTable)
              .where(eq(GuideStepTable.endingId, ending.id))

            return {
              ...ending,
              finished: Boolean(ending.finished),
              cover: ending.cover || undefined,
              steps: steps.map((step) => ({
                id: String(step.id),
                type: step.type,
                content: step.content,
                group: step.group || undefined,
                prefix: step.prefix || undefined,
                subfix: step.subfix || undefined,
                finished: Boolean(step.finished),
              })),
            }
          }),
        )

        return {
          ...route,
          finished: Boolean(route.finished),
          endings: endingsWithSteps,
        }
      }),
    )

    return NextResponse.json({
      id: guide.id,
      gameId: guide.gameId,
      name: guide.name,
      cover: guide.cover,
      level: guide.level,
      tips: guide.tips ? JSON.parse(guide.tips) : [],
      finished: Boolean(guide.finished),
      routes: routesWithDetails,
    })
  } catch (error) {
    console.error('Fetch guide error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guide' },
      { status: 500 },
    )
  }
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
    const body = await request.json()
    const { name, level, tips } = body as {
      name?: string
      level?: number
      tips?: string[]
    }

    // 查询攻略主表
    const guides = await db
      .select()
      .from(GameGuideTable)
      .where(eq(GameGuideTable.gameId, Number(gameId)))

    if (guides.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
    }

    const guide = guides[0]

    const updateData: Record<string, unknown> = {
      updatedAt: dayjs().toISOString(),
    }

    if (name !== undefined) {
      updateData.name = name.trim()
    }
    if (level !== undefined) {
      updateData.level = level
    }
    if (tips !== undefined) {
      updateData.tips = JSON.stringify(tips)
    }

    await db
      .update(GameGuideTable)
      .set(updateData)
      .where(eq(GameGuideTable.id, guide.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update guide error:', error)
    return NextResponse.json(
      { error: 'Failed to update guide' },
      { status: 500 },
    )
  }
}
