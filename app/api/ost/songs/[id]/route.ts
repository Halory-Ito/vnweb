import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameOstSongsTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const songId = Number(id)
    if (!Number.isInteger(songId) || songId <= 0) {
      return NextResponse.json({ error: 'Invalid song id' }, { status: 400 })
    }

    const body = await request.json()
    const { name, url, mediaType = '', lyricsText = '', lyricsPath = '' } = body

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const result = await db
      .update(GameOstSongsTable)
      .set({
        name,
        url,
        mediaType,
        lyricsText,
        lyricsPath,
        updatedAt: dayjs().toString(),
      })
      .where(eq(GameOstSongsTable.id, songId))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    return NextResponse.json({ data: { item: result[0] } })
  } catch (error) {
    console.error('Update ost song failed:', error)
    return NextResponse.json(
      { error: 'Failed to update ost song' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const songId = Number(id)
    if (!Number.isInteger(songId) || songId <= 0) {
      return NextResponse.json({ error: 'Invalid song id' }, { status: 400 })
    }

    const result = await db
      .delete(GameOstSongsTable)
      .where(eq(GameOstSongsTable.id, songId))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    return NextResponse.json({ data: { item: result[0] } })
  } catch (error) {
    console.error('Delete ost song failed:', error)
    return NextResponse.json(
      { error: 'Failed to delete ost song' },
      { status: 500 },
    )
  }
}
