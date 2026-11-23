import { NextResponse } from 'next/server'

import { readGameStatusMappings, updateGameStatusMapping } from '@/lib/server/game-status-mappings'
import { GAME_STATUS_SYNC_OPTIONS } from '@/lib/settings/game-status-sync'

export async function GET() {
  return NextResponse.json(await readGameStatusMappings())
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  const { statusId, provider, target } = body ?? {}
  if (
    !Number.isSafeInteger(statusId) ||
    statusId < 0 ||
    (provider !== 'bangumi' && provider !== 'vndb')
  ) {
    return NextResponse.json({ error: '无效的游戏状态映射' }, { status: 400 })
  }
  if (
    target !== null &&
    !GAME_STATUS_SYNC_OPTIONS[provider as 'bangumi' | 'vndb'].some(
      (option) => option.value === target,
    )
  ) {
    return NextResponse.json({ error: '无效的平台状态' }, { status: 400 })
  }
  if (!(await updateGameStatusMapping(statusId, provider, target))) {
    return NextResponse.json({ error: '游戏状态不存在' }, { status: 404 })
  }
  return NextResponse.json(await readGameStatusMappings())
}
