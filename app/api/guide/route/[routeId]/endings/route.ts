import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GuideEndingTable, GuideStepTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> },
) {
  const { routeId } = await params

  if (!routeId) {
    return NextResponse.json({ error: 'Missing routeId' }, { status: 400 })
  }

  try {
    const endings = await db
      .select()
      .from(GuideEndingTable)
      .where(eq(GuideEndingTable.routeId, Number(routeId)))

    const endingsWithSteps = await Promise.all(
      endings.map(async (ending) => {
        const steps = await db
          .select()
          .from(GuideStepTable)
          .where(eq(GuideStepTable.endingId, ending.id))

        return {
          id: String(ending.id),
          name: ending.name,
          type: ending.type,
          cover: ending.cover || undefined,
          finished: Boolean(ending.finished),
          requirements: ending.requirements || undefined,
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

    return NextResponse.json(endingsWithSteps)
  } catch (error) {
    console.error('Fetch endings error:', error)
    return NextResponse.json({ error: 'Failed to fetch endings' }, { status: 500 })
  }
}
