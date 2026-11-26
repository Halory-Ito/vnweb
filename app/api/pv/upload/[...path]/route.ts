import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import { getAssetsDir, getLegacyPublicAssetsDir } from '@/lib/server/runtime-paths.mjs'

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
    const pvRoots = [
      path.resolve(getAssetsDir(), 'pv'),
      path.resolve(getLegacyPublicAssetsDir(), 'pv'),
    ]

    const candidates = pvRoots.map((root) => {
      const resolved = path.resolve(root, ...pathSegments)
      return resolved.startsWith(root + path.sep) ? resolved : null
    })

    if (candidates.every((item) => item === null)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    let resolved: string | null = null
    let stat: Awaited<ReturnType<typeof fs.stat>> | null = null
    for (const candidate of candidates) {
      if (!candidate) continue
      try {
        const s = await fs.stat(candidate)
        if (s.isFile()) {
          resolved = candidate
          stat = s
          break
        }
      } catch {
        // Try next root
      }
    }

    if (!resolved || !stat) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const ext = path.extname(resolved).toLowerCase()
    const contentType = VIDEO_MIME_TYPES[ext] || 'application/octet-stream'

    const fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ resolved)

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
    return NextResponse.json({ error: 'Failed to serve video' }, { status: 500 })
  }
}

export { serveVideo as GET }
