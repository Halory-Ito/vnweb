import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/drizzle'
import { GameGuideTable, GuideRouteTable, GuideEndingTable, GuideStepTable } from '@/db/schema'
import type { GuideSearchResult } from '@/features/guide/guide-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId, guide } = body as { gameId: number; guide: GuideSearchResult }

    if (!gameId || !guide) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // 创建攻略主表记录
    const [guideRecord] = await db
      .insert(GameGuideTable)
      .values({
        gameId,
        name: guide.name['zh-cn'],
        cover: guide.cover,
        level: guide.level || 0,
        tips: JSON.stringify(guide.tips || []),
      })
      .returning()

    // 创建路线、结局、步骤
    for (const route of guide.routes) {
      const [guideRoute] = await db
        .insert(GuideRouteTable)
        .values({
          guideId: guideRecord.id,
          name: route.name,
        })
        .returning()

      for (const ending of route.endings) {
        const [guideEnding] = await db
          .insert(GuideEndingTable)
          .values({
            routeId: guideRoute.id,
            name: ending.name,
            type: ending.type || 'normal',
          })
          .returning()

        for (const step of ending.steps) {
          await db.insert(GuideStepTable).values({
            endingId: guideEnding.id,
            type: step.type || 'choice',
            content: step.content,
            group: step.group || '',
            prefix: step.prefix || '',
            subfix: step.subfix || '',
          })
        }
      }
    }

    return NextResponse.json({ success: true, guideId: guideRecord.id })
  } catch (error) {
    console.error('Import guide error:', error)
    return NextResponse.json(
      { error: 'Failed to import guide' },
      { status: 500 },
    )
  }
}
