import { NextRequest, NextResponse } from 'next/server'

import {
  detectImageExtFromBuffer,
  getImageMimeType,
  resolveImageBuffer,
} from '@/lib/server/platform-import/importer'
import { getImportSession } from '@/lib/server/platform-import/session-store'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')?.trim() || ''
  const sourceId = req.nextUrl.searchParams.get('sourceId')?.trim() || ''

  if (!sessionId || !sourceId) {
    return new NextResponse('Missing sessionId or sourceId', { status: 400 })
  }

  const session = await getImportSession(sessionId)
  if (!session) {
    return new NextResponse('Session not found', { status: 404 })
  }

  const game = session.games.find((item) => item.sourceId === sourceId)
  const cover = game?.images.cover
  if (!cover) {
    return new NextResponse('Cover not found', { status: 404 })
  }

  if (cover.kind === 'url') {
    return NextResponse.redirect(cover.url)
  }

  const resolved = await resolveImageBuffer(cover).catch(() => null)
  if (!resolved || resolved.buffer.length === 0) {
    return new NextResponse('Cover data unavailable', { status: 404 })
  }

  const ext = detectImageExtFromBuffer(resolved.buffer) || resolved.hintExt || 'jpg'
  const mime = getImageMimeType(ext)

  return new NextResponse(new Uint8Array(resolved.buffer), {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
