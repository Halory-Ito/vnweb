import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { GameInfoTable, GamePlayTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import extractIconFromExe from '@/win/extract-icon'

type LaunchBody = {
  exePath?: string
}

const normalizeWindowsPathInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const withBackslash = trimmed.replace(/\//g, '\\')
  return path.win32.normalize(withBackslash)
}

const sanitizeFileName = (value: string) =>
  value
    .trim()
    // oxlint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'game'

const launchGame = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const gameId = Number(id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    const payload = (await req.json().catch(() => ({}))) as LaunchBody
    const inputExePath = normalizeWindowsPathInput(payload?.exePath ?? '')

    const gameRows = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        date: GameInfoTable.date,
      })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    const game = gameRows[0]
    if (!game) {
      return NextResponse.json({ error: '游戏不存在' }, { status: 404 })
    }

    const playRows = await db
      .select({
        id: GamePlayTable.id,
        exePath: GamePlayTable.exePath,
        isRunning: GamePlayTable.isRunning,
      })
      .from(GamePlayTable)
      .where(eq(GamePlayTable.gameId, gameId))
      .limit(1)

    const currentPlay = playRows[0]
    if ((currentPlay?.isRunning ?? 0) === 1) {
      return NextResponse.json({ error: '游戏已在运行中' }, { status: 400 })
    }

    const storedExePath = normalizeWindowsPathInput(currentPlay?.exePath ?? '')
    const finalExePath = inputExePath || storedExePath

    if (!finalExePath) {
      return NextResponse.json(
        {
          error: '请先填写游戏可执行文件路径',
          requireExePath: true,
        },
        { status: 400 },
      )
    }

    if (!path.win32.isAbsolute(finalExePath)) {
      return NextResponse.json(
        { error: '可执行路径必须是绝对路径（例如 E:\\Games\\xxx.exe）' },
        { status: 400 },
      )
    }

    await fs.promises.access(finalExePath, fs.constants.F_OK).catch(() => {
      throw new Error(`可执行文件不存在: ${finalExePath}`)
    })

    const safeName = sanitizeFileName(game.name)
    const safeDate = sanitizeFileName(game.date || dayjs().format('YYYY-MM-DD'))
    const iconFileName = `${safeName}_${safeDate}.ico`

    const assetsIconDir = path.join(process.cwd(), 'assets', 'icon')
    const publicIconDir = path.join(process.cwd(), 'assets', 'icon')

    await fs.promises.mkdir(assetsIconDir, { recursive: true })
    await fs.promises.mkdir(publicIconDir, { recursive: true })

    const iconTargetPath = path.join(assetsIconDir, iconFileName)
    const extractedPath = await extractIconFromExe(finalExePath, iconTargetPath)
    const finalExtractedPath = path.resolve(extractedPath)
    const finalIconName = path.basename(finalExtractedPath)

    await fs.promises.copyFile(finalExtractedPath, path.join(publicIconDir, finalIconName))

    const iconPublicPath = `/assets/icon/${finalIconName}`
    const now = dayjs().toISOString()

    await db
      .update(GameInfoTable)
      .set({
        icon: iconPublicPath,
        updatedAt: now,
      })
      .where(eq(GameInfoTable.id, gameId))

    // 启动游戏
    const child = spawn(finalExePath, [], {
      cwd: path.dirname(finalExePath),
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    })
    child.unref()

    const launchedAt = new Date().toISOString()

    if (currentPlay) {
      await db
        .update(GamePlayTable)
        .set({
          exePath: finalExePath,
          isRunning: 1,
          lastLaunchedAt: launchedAt,
        })
        .where(eq(GamePlayTable.id, currentPlay.id))
    } else {
      await db.insert(GamePlayTable).values({
        gameId,
        exePath: finalExePath,
        isRunning: 1,
        lastLaunchedAt: launchedAt,
      })
    }

    return NextResponse.json({
      data: {
        exePath: finalExePath,
        iconPath: iconPublicPath,
      },
    })
  } catch (error) {
    console.error('Launch game failed:', error)
    return NextResponse.json({ error: (error as Error).message || '启动游戏失败' }, { status: 500 })
  }
}

export { launchGame as POST }
