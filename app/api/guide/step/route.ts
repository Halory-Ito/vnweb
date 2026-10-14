import dayjs from 'dayjs'
import { eq, max } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GuideEndingTable, GuideStepTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

// 新增步骤，需指定所属结局
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endingId, type, content, group, prefix, subfix } = body as {
      endingId?: number | string
      type?: string
      content?: string
      group?: string
      prefix?: string
      subfix?: string
    }

    const parsedEndingId = Number(endingId)

    if (!Number.isInteger(parsedEndingId) || parsedEndingId <= 0) {
      return NextResponse.json({ error: 'Missing endingId' }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Missing step content' }, { status: 400 })
    }

    const endings = await db
      .select({ id: GuideEndingTable.id })
      .from(GuideEndingTable)
      .where(eq(GuideEndingTable.id, parsedEndingId))

    if (endings.length === 0) {
      return NextResponse.json({ error: 'Ending not found' }, { status: 404 })
    }

    // 排序号接在该结局现有步骤之后
    const [orderResult] = await db
      .select({ value: max(GuideStepTable.sortOrder) })
      .from(GuideStepTable)
      .where(eq(GuideStepTable.endingId, parsedEndingId))

    const now = dayjs().toISOString()
    const [step] = await db
      .insert(GuideStepTable)
      .values({
        endingId: parsedEndingId,
        type: type?.trim() || 'choice',
        content: content.trim(),
        group: group?.trim() || '',
        prefix: prefix?.trim() || '',
        subfix: subfix?.trim() || '',
        sortOrder: (orderResult?.value ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return NextResponse.json({ success: true, id: String(step.id) })
  } catch (error) {
    console.error('Create step error:', error)
    return NextResponse.json({ error: 'Failed to create step' }, { status: 500 })
  }
}
