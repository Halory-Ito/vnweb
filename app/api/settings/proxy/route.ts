import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { ProxyConfigTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export async function GET() {
  try {
    const proxies = await db.select().from(ProxyConfigTable).all()
    return NextResponse.json({
      success: true,
      data: proxies,
    })
  } catch (error) {
    console.error('Failed to fetch proxies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch proxies' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, type, host, port, username, password, enabled } = body

    if (!name || !type || !host || !port) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // 如果启用了新代理，先禁用其他代理
    if (enabled) {
      await db
        .update(ProxyConfigTable)
        .set({ enabled: 0 })
        .where(eq(ProxyConfigTable.enabled, 1))
    }

    const result = await db
      .insert(ProxyConfigTable)
      .values({
        name,
        type,
        host,
        port,
        username: username || '',
        password: password || '',
        enabled: enabled ? 1 : 0,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    console.error('Failed to create proxy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create proxy' },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, type, host, port, username, password, enabled } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing proxy ID' },
        { status: 400 },
      )
    }

    // 如果启用了该代理，先禁用其他代理
    if (enabled) {
      await db
        .update(ProxyConfigTable)
        .set({ enabled: 0 })
        .where(eq(ProxyConfigTable.enabled, 1))
    }

    const result = await db
      .update(ProxyConfigTable)
      .set({
        name,
        type,
        host,
        port,
        username: username || '',
        password: password || '',
        enabled: enabled ? 1 : 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(ProxyConfigTable.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    console.error('Failed to update proxy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update proxy' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing proxy ID' },
        { status: 400 },
      )
    }

    await db
      .delete(ProxyConfigTable)
      .where(eq(ProxyConfigTable.id, parseInt(id)))

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete proxy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete proxy' },
      { status: 500 },
    )
  }
}
