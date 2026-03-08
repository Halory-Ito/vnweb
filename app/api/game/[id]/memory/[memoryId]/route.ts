import dayjs from 'dayjs'
import { and, eq } from 'drizzle-orm'
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

const parseIds = async (context: {
  params: Promise<{ id: string; memoryId: string }>
}) => {
  const { id, memoryId } = await context.params
  const gameId = Number(id)
  const memoryItemId = Number(memoryId)

  if (!Number.isInteger(gameId) || gameId <= 0) {
    throw new Error('Invalid game id')
  }
  if (!Number.isInteger(memoryItemId) || memoryItemId <= 0) {
    throw new Error('Invalid memory id')
  }

  return {
    gameId,
    memoryItemId,
  }
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

const getMemoryFilePath = (url: string | null) => {
  const normalized = normalizeText(url)
  if (!normalized.startsWith('/assets/memory/')) {
    return null
  }
  const filePath = path.join(process.cwd(), 'public', ...normalized.split('/'))
  return filePath
}

const updateGameMemory = async (
  req: NextRequest,
  context: { params: Promise<{ id: string; memoryId: string }> },
) => {
  try {
    const { gameId, memoryItemId } = await parseIds(context)
    await ensureGameExists(gameId)

    const rows = await db
      .select({
        id: GameMemoryTable.id,
        imageUrl: GameMemoryTable.imageUrl,
      })
      .from(GameMemoryTable)
      .where(
        and(
          eq(GameMemoryTable.id, memoryItemId),
          eq(GameMemoryTable.gameId, gameId),
        ),
      )
      .limit(1)

    const memory = rows[0]
    if (!memory) {
      return NextResponse.json({ error: '回忆不存在' }, { status: 404 })
    }

    const formData = await req.formData()
    const image = formData.get('image')
    const title = normalizeText(formData.get('title'))
    const description = normalizeText(formData.get('description'))

    let nextImageUrl = memory.imageUrl
    if (image instanceof File) {
      if (!image.type.startsWith('image/')) {
        return NextResponse.json(
          { error: '截图仅支持图片文件' },
          { status: 400 },
        )
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

      nextImageUrl = `/assets/memory/${gameId}/${fileName}`

      const oldFilePath = getMemoryFilePath(memory.imageUrl)
      if (oldFilePath) {
        await fs.unlink(oldFilePath).catch(() => undefined)
      }
    }

    const now = dayjs().toISOString()
    const updated = await db
      .update(GameMemoryTable)
      .set({
        title,
        description,
        imageUrl: nextImageUrl,
        updatedAt: now,
      })
      .where(
        and(
          eq(GameMemoryTable.id, memoryItemId),
          eq(GameMemoryTable.gameId, gameId),
        ),
      )
      .returning({
        id: GameMemoryTable.id,
        gameId: GameMemoryTable.gameId,
        title: GameMemoryTable.title,
        description: GameMemoryTable.description,
        imageUrl: GameMemoryTable.imageUrl,
        createdAt: GameMemoryTable.createdAt,
        updatedAt: GameMemoryTable.updatedAt,
      })

    return NextResponse.json({ data: { item: updated[0] } })
  } catch (error) {
    const message = (error as Error).message || '更新回忆失败'
    if (message === 'Invalid game id' || message === 'Invalid memory id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const deleteGameMemory = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string; memoryId: string }> },
) => {
  try {
    const { gameId, memoryItemId } = await parseIds(context)
    await ensureGameExists(gameId)

    const rows = await db
      .select({
        id: GameMemoryTable.id,
        imageUrl: GameMemoryTable.imageUrl,
      })
      .from(GameMemoryTable)
      .where(
        and(
          eq(GameMemoryTable.id, memoryItemId),
          eq(GameMemoryTable.gameId, gameId),
        ),
      )
      .limit(1)

    const memory = rows[0]
    if (!memory) {
      return NextResponse.json({ error: '回忆不存在' }, { status: 404 })
    }

    await db
      .delete(GameMemoryTable)
      .where(
        and(
          eq(GameMemoryTable.id, memoryItemId),
          eq(GameMemoryTable.gameId, gameId),
        ),
      )

    const filePath = getMemoryFilePath(memory.imageUrl)
    if (filePath) {
      await fs.unlink(filePath).catch(() => undefined)
    }

    return NextResponse.json({ data: { deleted: true, id: memoryItemId } })
  } catch (error) {
    const message = (error as Error).message || '删除回忆失败'
    if (message === 'Invalid game id' || message === 'Invalid memory id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export { updateGameMemory as PATCH, deleteGameMemory as DELETE }
