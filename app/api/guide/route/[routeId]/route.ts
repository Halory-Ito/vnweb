import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GuideRouteTable } from '@/db/schema'
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
    const routes = await db
      .select()
      .from(GuideRouteTable)
      .where(eq(GuideRouteTable.id, Number(routeId)))

    if (routes.length === 0) {
      return NextResponse.json(null)
    }

    const route = routes[0]

    return NextResponse.json({
      id: String(route.id),
      name: route.name,
      finished: Boolean(route.finished),
    })
  } catch (error) {
    console.error('Fetch route error:', error)
    return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> },
) {
  const { routeId } = await params

  if (!routeId) {
    return NextResponse.json({ error: 'Missing routeId' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { name } = body as { name?: string }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Missing route name' }, { status: 400 })
    }

    await db
      .update(GuideRouteTable)
      .set({
        name: name.trim(),
        updatedAt: dayjs().toISOString(),
      })
      .where(eq(GuideRouteTable.id, Number(routeId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update route error:', error)
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 })
  }
}
