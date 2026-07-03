import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const PV_DIR = path.join(process.cwd(), 'assets', 'pv')

const VIDEO_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.m4v': 'video/mp4',
}

const serveVideo = async (
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) => {
  try {
    const { path: pathSegments } = await params
    const filePath = path.join(PV_DIR, ...pathSegments)

    // Security: ensure the resolved path is within PV_DIR
    const resolved = path.resolve(filePath)
    if (!resolved.startsWith(path.resolve(PV_DIR))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const stat = await fs.stat(resolved)
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const ext = path.extname(resolved).toLowerCase()
    const contentType = VIDEO_MIME_TYPES[ext] || 'application/octet-stream'

    const fileBuffer = await fs.readFile(resolved)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    console.error('Serve PV video failed:', error)
    return NextResponse.json(
      { error: 'Failed to serve video' },
      { status: 500 },
    )
  }
}

export { serveVideo as GET }
