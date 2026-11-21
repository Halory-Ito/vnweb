import { NextRequest, NextResponse } from 'next/server'

import { GAME_STATUS_NAME_MAX_LENGTH } from '@/features/game/lib/game-status'
import {
  addGameStatus,
  deleteGameStatus,
  readGameStatusSettings,
  updateGameStatusFields,
} from '@/lib/server/game-status-settings'

export async function GET() {
  try {
    return NextResponse.json(await readGameStatusSettings())
  } catch (error) {
    console.error('Get status settings failed:', error)
    return NextResponse.json({ error: '获取游戏状态设置失败' }, { status: 500 })
  }
}

async function updateSettings(req: NextRequest, field: 'name' | 'color') {
  try {
    const body: unknown = await req.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: '无效的游戏状态设置' }, { status: 400 })
    }
    const updates = Object.entries(body).filter(
      ([, value]) =>
        typeof value === 'string' && value.trim().length <= GAME_STATUS_NAME_MAX_LENGTH,
    )
    await updateGameStatusFields(Object.fromEntries(updates), field)
    return NextResponse.json(await readGameStatusSettings())
  } catch (error) {
    console.error('Update status settings failed:', error)
    return NextResponse.json({ error: '更新游戏状态设置失败' }, { status: 500 })
  }
}

export function POST(req: NextRequest) {
  return updateSettings(req, 'color')
}

export function PUT(req: NextRequest) {
  return updateSettings(req, 'name')
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name || name.length > GAME_STATUS_NAME_MAX_LENGTH) {
      return NextResponse.json({ error: '游戏状态名称长度无效' }, { status: 400 })
    }
    await addGameStatus(name)
    return NextResponse.json(await readGameStatusSettings(), { status: 201 })
  } catch (error) {
    console.error('Add game status failed:', error)
    return NextResponse.json({ error: '新增游戏状态失败' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const id = body?.id
    if (!Number.isSafeInteger(id) || id < 0) {
      return NextResponse.json({ error: '无效的游戏状态' }, { status: 400 })
    }
    const affectedGames = await deleteGameStatus(id)
    return NextResponse.json({ ...(await readGameStatusSettings()), affectedGames })
  } catch (error) {
    console.error('Delete game status failed:', error)
    return NextResponse.json({ error: '删除游戏状态失败' }, { status: 500 })
  }
}
