import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { localizeGameImageInBackground } from '@/lib/server/game-image-storage'

type ImageType = 'cover' | 'bg' | 'icon' | 'logo'

type Payload = {
  imageType?: ImageType
  sourceUrl?: string
}

const localizeGameImage = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const gameId = Number(id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const body = (await req.json().catch(() => ({}))) as Payload
    const imageType = body.imageType
    const sourceUrl = String(body.sourceUrl || '').trim()

    if (!imageType || !['cover', 'bg', 'icon', 'logo'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }

    if (!sourceUrl) {
      return NextResponse.json({ error: 'Missing source url' }, { status: 400 })
    }

    const rows = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        date: GameInfoTable.date,
      })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    const game = rows[0]
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const gameName = (game.nameCn || game.name || `game_${gameId}`).trim()
    const localPath = localizeGameImageInBackground({
      gameName,
      releaseDate: game.date,
      imageType,
      sourceUrl,
    })

    return NextResponse.json({
      data: {
        path: localPath,
      },
    })
  } catch (error) {
    console.error('Localize image failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Localize image failed' },
      { status: 500 },
    )
  }
}

export { localizeGameImage as POST }
