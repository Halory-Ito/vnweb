import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import { GameInfoTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const MAX_UPLOAD_SIZE = 100 * 1024 * 1024

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'ost'

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
  return '.mp3'
}

const importOst = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到上传文件' }, { status: 400 })
    }

    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'OST仅支持音频文件' }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: '文件大小需在 1B 到 100MB 之间' },
        { status: 400 },
      )
    }

    const ext = getSafeExt(file.name)
    const baseName = sanitizeFileName(
      path.basename(file.name, path.extname(file.name)),
    )
    const fileName = `${baseName}_${Date.now()}${ext}`
    const targetDir = path.join(
      process.cwd(),
      'public',
      'assets',
      'ost',
      String(gameId),
    )
    const targetPath = path.join(targetDir, fileName)

    await fs.mkdir(targetDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await fs.writeFile(targetPath, Buffer.from(bytes))

    return NextResponse.json({
      data: {
        name: path.basename(file.name, path.extname(file.name)),
        path: `/assets/ost/${gameId}/${fileName}`,
      },
    })
  } catch (error) {
    const message = (error as Error).message || '导入OST失败'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export { importOst as POST }
