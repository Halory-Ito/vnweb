import { inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameOstSongsTable, GameOstTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export async function DELETE(request: NextRequest) {
  const payload: { ids?: unknown } | null = await request.json().catch(() => null)
  const ids = payload?.ids
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    !ids.every((id: unknown) => typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
  ) {
    return NextResponse.json({ error: '请选择有效的 OST' }, { status: 400 })
  }

  const uniqueIds = [...new Set<number>(ids)]
  try {
    await db.transaction(async (tx) => {
      for (let offset = 0; offset < uniqueIds.length; offset += 500) {
        const batch = uniqueIds.slice(offset, offset + 500)
        await tx.delete(GameOstSongsTable).where(inArray(GameOstSongsTable.ostId, batch))
        await tx.delete(GameOstTable).where(inArray(GameOstTable.id, batch))
      }
    })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Batch delete OST failed:', error)
    return NextResponse.json({ error: '批量删除 OST 失败' }, { status: 500 })
  }
}
