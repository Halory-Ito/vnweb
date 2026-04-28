import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import { GameInfoTable, GameOstSongsTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const MAX_UPLOAD_SIZE = 2 * 1024 * 1024

const parseGameId = async (context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const gameId = Number(id)
  if (!Number.isInteger(gameId) || gameId <= 0) {
    throw new Error('Invalid game id')
  }
  return gameId
}

const ensureGameExists = async (gameId: number) => {
  const rows = await db
    .select({ id: GameInfoTable.id })
    .from(GameInfoTable)
    .where(eq(GameInfoTable.id, gameId))
    .limit(1)

  if (!rows[0]) {
    throw new Error('Game not found')
  }
}

const normalizeName = (value: string) => {
  return value
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const uploadOstLyric = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const formData = await req.formData()
    const file = formData.get('file')
    const itemId = Number(formData.get('itemId'))

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到歌词文件' }, { status: 400 })
    }

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: '歌词文件大小需在 1B 到 2MB 之间' },
        { status: 400 },
      )
    }

    const inputExt = path.extname(file.name).toLowerCase()
    if (inputExt !== '.lrc') {
      return NextResponse.json(
        { error: '仅支持 .lrc 歌词文件' },
        { status: 400 },
      )
    }

    const rows = await db
      .select({
        id: GameOstSongsTable.id,
        ostId: GameOstSongsTable.ostId,
        url: GameOstSongsTable.url,
        name: GameOstSongsTable.name,
      })
      .from(GameOstSongsTable)
      .where(
        and(
          eq(GameOstSongsTable.id, itemId),
          eq(GameOstSongsTable.gameId, gameId),
        ),
      )
      .limit(1)

    const item = rows[0]
    if (!item) {
      return NextResponse.json({ error: 'OST song not found' }, { status: 404 })
    }

    if (!item.url.startsWith(`/assets/ost/`)) {
      return NextResponse.json(
        { error: '仅支持为本地 OST 文件上传歌词' },
        { status: 400 },
      )
    }

    const safeBaseName = normalizeName(item.name) || `song_${itemId}`
    const targetFileName = `${safeBaseName}.lrc`

    const targetDir = path.join(
      process.cwd(),
      'public',
      'assets',
      'ost',
      String(item.ostId),
    )
    const targetPath = path.join(targetDir, targetFileName)

    await fs.mkdir(targetDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await fs.writeFile(targetPath, Buffer.from(bytes))

    const lyricsUrl = `/assets/ost/${item.ostId}/${targetFileName}`

    // 保存歌词记录到数据库
    const { GameOstLyricsTable } = await import('@/db/schema')
    const now = new Date().toISOString()
    await db.insert(GameOstLyricsTable).values({
      ostSongId: itemId,
      lyricsUrl,
      updatedAt: now,
    })

    return NextResponse.json({
      data: {
        itemId,
        path: lyricsUrl,
      },
    })
  } catch (error) {
    const message = (error as Error).message || '上传歌词失败'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export { uploadOstLyric as POST }
