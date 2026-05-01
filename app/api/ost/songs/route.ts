import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameOstSongsTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export async function GET(request: NextRequest) {
  try {
    const ostId = request.nextUrl.searchParams.get('ostId')

    if (!ostId) {
      return NextResponse.json(
        { error: 'Missing ostId parameter' },
        { status: 400 },
      )
    }

    const parsedOstId = Number(ostId)
    if (!Number.isInteger(parsedOstId) || parsedOstId <= 0) {
      return NextResponse.json({ error: 'Invalid ostId' }, { status: 400 })
    }

    const songs = await db
      .select({
        id: GameOstSongsTable.id,
        gameId: GameOstSongsTable.gameId,
        ostId: GameOstSongsTable.ostId,
        name: GameOstSongsTable.name,
        url: GameOstSongsTable.url,
        mediaType: GameOstSongsTable.mediaType,
        lyricsText: GameOstSongsTable.lyricsText,
        lyricsPath: GameOstSongsTable.lyricsPath,
        createdAt: GameOstSongsTable.createdAt,
        updatedAt: GameOstSongsTable.updatedAt,
      })
      .from(GameOstSongsTable)
      .where(eq(GameOstSongsTable.ostId, parsedOstId))
      .orderBy(GameOstSongsTable.id)

    return NextResponse.json({
      data: {
        items: songs,
      },
    })
  } catch (error) {
    console.error('Get ost songs failed:', error)
    return NextResponse.json(
      { error: 'Failed to get ost songs' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      gameId,
      ostId,
      name,
      url,
      mediaType = '',
      lyricsText = '',
      lyricsPath = '',
    } = body

    if (!gameId || !ostId || !name || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const result = await db
      .insert(GameOstSongsTable)
      .values({
        gameId,
        ostId,
        name,
        url,
        mediaType,
        lyricsText,
        lyricsPath,
      })
      .returning()

    return NextResponse.json({ data: { item: result[0] } })
  } catch (error) {
    console.error('Create ost song failed:', error)
    return NextResponse.json(
      { error: 'Failed to create ost song' },
      { status: 500 },
    )
  }
}
