import { NextRequest, NextResponse } from 'next/server'

import { executePlatformImport } from '@/lib/server/platform-import/importer'
import { deleteImportSession, getImportSession } from '@/lib/server/platform-import/session-store'

import type {
  PlatformImportConflictStrategy,
  PlatformImportExecutePayload,
  PlatformImportOptions,
} from '@/types/platform-import'

export const maxDuration = 300

const DEFAULT_OPTIONS: PlatformImportOptions = {
  conflictStrategy: 'keep_existing',
  importPlayRecords: true,
  importImages: true,
  importCollections: true,
  importMemories: true,
  importCharacters: true,
}

function normalizeConflictStrategy(raw: unknown): PlatformImportConflictStrategy {
  if (raw === 'merge') return 'merge'
  if (raw === 'replace_with_imported') return 'replace_with_imported'
  return 'keep_existing'
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<PlatformImportExecutePayload>
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    if (!sessionId) {
      return NextResponse.json({ error: '缺少导入会话 ID' }, { status: 400 })
    }

    const session = await getImportSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: '导入会话已过期，请重新解析数据源' }, { status: 404 })
    }

    const selectedSourceIds = Array.isArray(body.selectedSourceIds)
      ? body.selectedSourceIds.filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0,
        )
      : []

    if (selectedSourceIds.length === 0) {
      return NextResponse.json({ error: '请至少选择一款要导入的游戏' }, { status: 400 })
    }

    const options: PlatformImportOptions = {
      conflictStrategy: normalizeConflictStrategy(body.options?.conflictStrategy),
      importPlayRecords: body.options?.importPlayRecords ?? DEFAULT_OPTIONS.importPlayRecords,
      importImages: body.options?.importImages ?? DEFAULT_OPTIONS.importImages,
      importCollections: body.options?.importCollections ?? DEFAULT_OPTIONS.importCollections,
      importMemories: body.options?.importMemories ?? DEFAULT_OPTIONS.importMemories,
      importCharacters: body.options?.importCharacters ?? DEFAULT_OPTIONS.importCharacters,
    }

    const itemStrategies: Record<string, PlatformImportConflictStrategy> = {}
    if (body.itemStrategies && typeof body.itemStrategies === 'object') {
      for (const [sourceId, strategy] of Object.entries(body.itemStrategies)) {
        if (sourceId.trim()) {
          itemStrategies[sourceId] = normalizeConflictStrategy(strategy)
        }
      }
    }

    const result = await executePlatformImport(session, selectedSourceIds, options, itemStrategies)

    if (result.failedCount === 0) {
      await deleteImportSession(sessionId)
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Platform import execute failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '执行跨平台导入失败' },
      { status: 500 },
    )
  }
}
