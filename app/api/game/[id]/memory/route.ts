import dayjs from 'dayjs'
import { and, desc, eq, like } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import { GameInfoTable, GameMemoryTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'memory'

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

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

const getSafeExt = (fileName: string) => {
  const ext = path.extname(fileName).toLowerCase()
  if (ext && /^[.][a-z0-9]{1,10}$/.test(ext)) {
    return ext
  }
  return '.png'
}

const listGameMemories = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const titleKeyword = normalizeText(req.nextUrl.searchParams.get('title'))

    const items = await db
      .select({
        id: GameMemoryTable.id,
        gameId: GameMemoryTable.gameId,
        title: GameMemoryTable.title,
        description: GameMemoryTable.description,
        imageUrl: GameMemoryTable.imageUrl,
        createdAt: GameMemoryTable.createdAt,
        updatedAt: GameMemoryTable.updatedAt,
      })
      .from(GameMemoryTable)
      .where(
        titleKeyword
          ? and(
              eq(GameMemoryTable.gameId, gameId),
              like(GameMemoryTable.title, `%${titleKeyword}%`),
            )
          : eq(GameMemoryTable.gameId, gameId),
      )
      .orderBy(desc(GameMemoryTable.updatedAt), desc(GameMemoryTable.id))

    return NextResponse.json({ data: { items } })
  } catch (error) {
    const message = (error as Error).message || '查询回忆失败'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const createGameMemory = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const formData = await req.formData()
    const image = formData.get('image')
    const title = normalizeText(formData.get('title'))
    const description = normalizeText(formData.get('description'))

    if (!(image instanceof File)) {
      return NextResponse.json({ error: '请上传截图' }, { status: 400 })
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: '截图仅支持图片文件' }, { status: 400 })
    }

    if (image.size <= 0 || image.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: '截图大小需在 1B 到 20MB 之间' },
        { status: 400 },
      )
    }

    const ext = getSafeExt(image.name)
    const baseName = sanitizeFileName(
      path.basename(image.name, path.extname(image.name)),
    )
    const fileName = `${baseName}_${Date.now()}${ext}`
    const targetDir = path.join(
      process.cwd(),
      'public',
      'assets',
      'memory',
      String(gameId),
    )
    const targetPath = path.join(targetDir, fileName)

    await fs.mkdir(targetDir, { recursive: true })

    const bytes = await image.arrayBuffer()
    await fs.writeFile(targetPath, Buffer.from(bytes))

    const now = dayjs().toISOString()
    const imageUrl = `/assets/memory/${gameId}/${fileName}`

    const inserted = await db
      .insert(GameMemoryTable)
      .values({
        gameId,
        title,
        description,
        imageUrl,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: GameMemoryTable.id,
        gameId: GameMemoryTable.gameId,
        title: GameMemoryTable.title,
        description: GameMemoryTable.description,
        imageUrl: GameMemoryTable.imageUrl,
        createdAt: GameMemoryTable.createdAt,
        updatedAt: GameMemoryTable.updatedAt,
      })

    return NextResponse.json({ data: { item: inserted[0] } })
  } catch (error) {
    const message = (error as Error).message || '新增回忆失败'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export { listGameMemories as GET, createGameMemory as POST }
