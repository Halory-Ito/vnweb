import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameGuideTable, GuideRouteTable, GuideEndingTable, GuideStepTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

import type { GuideSearchResult } from '@/features/guide/guide-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId, guide, overwrite } = body as {
      gameId: number
      guide: GuideSearchResult
      overwrite?: boolean
    }

    if (!gameId || !guide) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 检查是否已有攻略
    const existingGuides = await db
      .select()
      .from(GameGuideTable)
      .where(eq(GameGuideTable.gameId, gameId))

    if (existingGuides.length > 0 && !overwrite) {
      return NextResponse.json({ error: '该游戏已有攻略，请使用覆盖模式导入' }, { status: 409 })
    }

    await db.transaction(async (tx) => {
      // 覆盖模式：删除旧攻略
      if (existingGuides.length > 0) {
        const existingGuide = existingGuides[0]
        const routes = await tx
          .select()
          .from(GuideRouteTable)
          .where(eq(GuideRouteTable.guideId, existingGuide.id))

        for (const route of routes) {
          const endings = await tx
            .select()
            .from(GuideEndingTable)
            .where(eq(GuideEndingTable.routeId, route.id))

          for (const ending of endings) {
            await tx.delete(GuideStepTable).where(eq(GuideStepTable.endingId, ending.id))
          }
          await tx.delete(GuideEndingTable).where(eq(GuideEndingTable.routeId, route.id))
        }
        await tx.delete(GuideRouteTable).where(eq(GuideRouteTable.guideId, existingGuide.id))
        await tx.delete(GameGuideTable).where(eq(GameGuideTable.id, existingGuide.id))
      }

      // 创建攻略主表记录
      const [guideRecord] = await tx
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
        const [guideRoute] = await tx
          .insert(GuideRouteTable)
          .values({
            guideId: guideRecord.id,
            name: route.name,
          })
          .returning()

        for (const ending of route.endings) {
          const [guideEnding] = await tx
            .insert(GuideEndingTable)
            .values({
              routeId: guideRoute.id,
              name: ending.name,
              type: ending.type || 'normal',
              cover: ending.cover || '',
              requirements: ending.requirements || '',
            })
            .returning()

          for (const step of ending.steps) {
            await tx.insert(GuideStepTable).values({
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
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Import guide error:', error)
    return NextResponse.json({ error: 'Failed to import guide' }, { status: 500 })
  }
}
