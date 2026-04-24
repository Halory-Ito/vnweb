import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { CollectionGameTable, CollectionTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const deleteCollectionById = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const collectionId = Number(id)

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      return NextResponse.json({ error: '无效的收藏夹 id' }, { status: 400 })
    }

    const collection = await db
      .select({ id: CollectionTable.id })
      .from(CollectionTable)
      .where(eq(CollectionTable.id, collectionId))
      .limit(1)

    if (!collection[0]) {
      return NextResponse.json({ error: '收藏夹不存在' }, { status: 404 })
    }

    await db
      .delete(CollectionGameTable)
      .where(eq(CollectionGameTable.collectionId, collectionId))

    await db.delete(CollectionTable).where(eq(CollectionTable.id, collectionId))

    return NextResponse.json({
      data: {
        deleted: true,
        id: collectionId,
      },
    })
  } catch (error) {
    console.error('Delete collection failed:', error)
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 },
    )
  }
}

export { deleteCollectionById as DELETE }
