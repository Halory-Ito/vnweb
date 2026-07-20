import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/drizzle'
import { GuideStepTable } from '@/db/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> },
) {
  const { stepId } = await params

  if (!stepId) {
    return NextResponse.json({ error: 'Missing stepId' }, { status: 400 })
  }

  try {
    const steps = await db
      .select()
      .from(GuideStepTable)
      .where(eq(GuideStepTable.id, Number(stepId)))

    if (steps.length === 0) {
      return NextResponse.json(null)
    }

    const step = steps[0]

    return NextResponse.json({
      id: String(step.id),
      type: step.type,
      content: step.content,
      group: step.group || undefined,
      prefix: step.prefix || undefined,
      subfix: step.subfix || undefined,
      finished: Boolean(step.finished),
    })
  } catch (error) {
    console.error('Fetch step error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch step' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> },
) {
  const { stepId } = await params

  if (!stepId) {
    return NextResponse.json({ error: 'Missing stepId' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { type, content, group, prefix, subfix } = body as {
      type?: string
      content?: string
      group?: string
      prefix?: string
      subfix?: string
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Missing step content' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      content: content.trim(),
      updatedAt: dayjs().toISOString(),
    }

    if (type !== undefined) {
      updateData.type = type
    }
    if (group !== undefined) {
      updateData.group = group
    }
    if (prefix !== undefined) {
      updateData.prefix = prefix
    }
    if (subfix !== undefined) {
      updateData.subfix = subfix
    }

    await db
      .update(GuideStepTable)
      .set(updateData)
      .where(eq(GuideStepTable.id, Number(stepId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update step error:', error)
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 },
    )
  }
}
