import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle'
import {
  GameGuideTable,
  GuideRouteTable,
  GuideEndingTable,
  GuideStepTable,
} from '@/db/schema'

export async function GET() {
  try {
    const guides = await db.select().from(GameGuideTable)

    const guidesWithProgress = await Promise.all(
      guides.map(async (guide) => {
        const routes = await db
          .select()
          .from(GuideRouteTable)
          .where(eq(GuideRouteTable.guideId, guide.id))

        let totalSteps = 0
        let completedSteps = 0

        for (const route of routes) {
          const endings = await db
            .select()
            .from(GuideEndingTable)
            .where(eq(GuideEndingTable.routeId, route.id))

          for (const ending of endings) {
            const steps = await db
              .select()
              .from(GuideStepTable)
              .where(eq(GuideStepTable.endingId, ending.id))

            totalSteps += steps.length
            completedSteps += steps.filter((s) => s.finished).length
          }
        }

        return {
          id: guide.id,
          gameId: guide.gameId,
          name: guide.name,
          cover: guide.cover,
          totalSteps,
          completedSteps,
          percentage:
            totalSteps > 0
              ? Math.round((completedSteps / totalSteps) * 100)
              : 0,
        }
      }),
    )

    return NextResponse.json(guidesWithProgress)
  } catch (error) {
    console.error('Fetch guide list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guide list' },
      { status: 500 },
    )
  }
}
