import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { GamePlayTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const normalizeWindowsPathInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const withBackslash = trimmed.replace(/\//g, '\\')
  return path.win32.normalize(withBackslash)
}

const openGameLocalFile = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const gameId = Number(id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    const playRows = await db
      .select({
        exePath: GamePlayTable.exePath,
      })
      .from(GamePlayTable)
      .where(eq(GamePlayTable.gameId, gameId))
      .limit(1)

    const exePath = normalizeWindowsPathInput(playRows[0]?.exePath ?? '')
    if (!exePath) {
      return NextResponse.json(
        {
          error: '请先添加游戏可执行路径',
          requireExePath: true,
        },
        { status: 400 },
      )
    }

    if (!path.win32.isAbsolute(exePath)) {
      return NextResponse.json(
        { error: '可执行路径必须是绝对路径' },
        { status: 400 },
      )
    }

    await fs.promises.access(exePath, fs.constants.F_OK).catch(() => {
      throw new Error(`可执行文件不存在: ${exePath}`)
    })

    const cmd = `start "" explorer.exe /select,"${exePath}"`
    const child = spawn('cmd.exe', ['/c', cmd], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      shell: false,
    })
    child.unref()

    return NextResponse.json({
      data: {
        opened: true,
        exePath,
      },
    })
  } catch (error) {
    console.error('Browse local file failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '打开本地文件失败' },
      { status: 500 },
    )
  }
}

export { openGameLocalFile as POST }
