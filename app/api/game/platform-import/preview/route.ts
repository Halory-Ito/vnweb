import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'

import {
  buildExistingGameMatcher,
  buildSessionPreview,
} from '@/lib/server/platform-import/importer'
import { parsePlayniteImportData } from '@/lib/server/platform-import/playnite-parser'
import { parsePotatoVnImportData } from '@/lib/server/platform-import/potatovn-parser'
import {
  createImportTempDir,
  deleteImportSession,
  generateImportSessionId,
  saveImportSession,
} from '@/lib/server/platform-import/session-store'
import { parseVniteImportData } from '@/lib/server/platform-import/vnite-parser'

import type { ParsedPlatformData } from '@/lib/server/platform-import/types'
import type { ExternalImportPlatform } from '@/types/platform-import'

export const maxDuration = 300

function isValidPlatform(value: string): value is ExternalImportPlatform {
  return value === 'playnite' || value === 'vnite' || value === 'potatovn'
}

async function parseByPlatform(
  platform: ExternalImportPlatform,
  params: { fileBuffer?: Buffer; fileName?: string; localPath?: string; tempDir: string },
): Promise<ParsedPlatformData> {
  if (platform === 'playnite') return parsePlayniteImportData(params)
  if (platform === 'vnite') return parseVniteImportData(params)
  return parsePotatoVnImportData(params)
}

export async function POST(req: NextRequest) {
  const sessionId = generateImportSessionId()
  const tempDir = createImportTempDir(sessionId)

  try {
    const contentType = req.headers.get('content-type') || ''
    let platformRaw = ''
    let fileBuffer: Buffer | undefined
    let fileName: string | undefined
    let localPath: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      platformRaw = String(formData.get('platform') || '')
        .trim()
        .toLowerCase()
      const file = formData.get('file')
      if (!(file instanceof File)) {
        return NextResponse.json({ error: '未检测到上传文件' }, { status: 400 })
      }
      fileName = file.name
      fileBuffer = Buffer.from(await file.arrayBuffer())
    } else {
      const body = (await req.json().catch(() => ({}))) as {
        platform?: string
        localPath?: string
      }
      platformRaw = String(body.platform || '')
        .trim()
        .toLowerCase()
      localPath = typeof body.localPath === 'string' ? body.localPath.trim() : ''
    }

    if (!isValidPlatform(platformRaw)) {
      return NextResponse.json({ error: '不支持的导入平台类型' }, { status: 400 })
    }

    const parsed = await parseByPlatform(platformRaw, {
      fileBuffer,
      fileName,
      localPath,
      tempDir,
    })

    if (parsed.games.length === 0) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
      return NextResponse.json({ error: '未在数据源中解析到任何游戏条目' }, { status: 400 })
    }

    const session = await saveImportSession({
      sessionId,
      platform: parsed.platform,
      detectedFormat: parsed.detectedFormat,
      games: parsed.games,
      warnings: parsed.warnings,
      tempDir: parsed.tempDir,
      createdAt: Date.now(),
    })

    const matcher = await buildExistingGameMatcher()
    const preview = buildSessionPreview(session, matcher)

    return NextResponse.json({ data: preview })
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
    console.error('Platform import preview failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '解析导入数据失败' },
      { status: 400 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')?.trim() || ''
  if (sessionId) {
    await deleteImportSession(sessionId)
  }
  return NextResponse.json({ data: { deleted: true } })
}
