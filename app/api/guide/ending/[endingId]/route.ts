import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/drizzle'
import { GuideEndingTable } from '@/db/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endingId: string }> },
) {
  const { endingId } = await params

  if (!endingId) {
    return NextResponse.json({ error: 'Missing endingId' }, { status: 400 })
  }

  try {
    const endings = await db
      .select()
      .from(GuideEndingTable)
      .where(eq(GuideEndingTable.id, Number(endingId)))

    if (endings.length === 0) {
      return NextResponse.json(null)
    }

    const ending = endings[0]

    return NextResponse.json({
      id: String(ending.id),
      name: ending.name,
      type: ending.type,
      finished: Boolean(ending.finished),
      requirements: ending.requirements || undefined,
      cover: ending.cover || undefined,
    })
  } catch (error) {
    console.error('Fetch ending error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ending' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ endingId: string }> },
) {
  const { endingId } = await params

  if (!endingId) {
    return NextResponse.json({ error: 'Missing endingId' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { name, type, requirements, cover } = body as {
      name?: string
      type?: string
      requirements?: string
      cover?: string
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Missing ending name' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      updatedAt: dayjs().toISOString(),
    }

    if (type !== undefined) {
      updateData.type = type
    }
    if (requirements !== undefined) {
      updateData.requirements = requirements
    }
    if (cover !== undefined) {
      updateData.cover = cover
    }

    await db
      .update(GuideEndingTable)
      .set(updateData)
      .where(eq(GuideEndingTable.id, Number(endingId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update ending error:', error)
    return NextResponse.json(
      { error: 'Failed to update ending' },
      { status: 500 },
    )
  }
}
