import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/drizzle'
import { GuideStepTable } from '@/db/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endingId: string }> },
) {
  const { endingId } = await params

  if (!endingId) {
    return NextResponse.json({ error: 'Missing endingId' }, { status: 400 })
  }

  try {
    const steps = await db
      .select()
      .from(GuideStepTable)
      .where(eq(GuideStepTable.endingId, Number(endingId)))

    const stepsWithProgress = steps.map((step) => ({
      id: String(step.id),
      type: step.type,
      content: step.content,
      group: step.group || undefined,
      prefix: step.prefix || undefined,
      subfix: step.subfix || undefined,
      finished: Boolean(step.finished),
    }))

    return NextResponse.json(stepsWithProgress)
  } catch (error) {
    console.error('Fetch steps error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch steps' },
      { status: 500 },
    )
  }
}
