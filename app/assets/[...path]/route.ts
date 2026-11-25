import fs from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

import {
  LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY,
  LIBRARY_FOLDER_LOGO_DIRECTORY,
} from '@/lib/library-folder-logo-path'
import { getAssetsDir, getLegacyPublicAssetsDir } from '@/lib/server/runtime-paths.mjs'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.m4v': 'video/x-m4v',
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.opus': 'audio/opus',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.ttc': 'font/collection',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.lrc': 'text/plain; charset=utf-8',
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

function resolveWithinRoot(rootDir: string, segments: string[]): string | null {
  const resolvedRoot = path.resolve(rootDir)
  const candidate = path.resolve(resolvedRoot, ...segments)
  if (candidate !== resolvedRoot && !candidate.startsWith(resolvedRoot + path.sep)) {
    return null
  }
  return candidate
}

function toWebStream(stream: fs.ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      stream.on('data', (chunk) => {
        if (closed) return
        controller.enqueue(typeof chunk === 'string' ? Buffer.from(chunk) : new Uint8Array(chunk))
      })
      stream.on('end', () => {
        if (closed) return
        closed = true
        controller.close()
      })
      stream.on('error', (err) => {
        if (closed) return
        closed = true
        controller.error(err)
      })
    },
    cancel() {
      stream.destroy()
    },
  })
}

function parseByteRange(
  rangeHeader: string,
  totalSize: number,
): { start: number; end: number } | 'invalid' {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim())
  if (!match) return 'invalid'

  const [, rawStart, rawEnd] = match
  if (!rawStart && !rawEnd) return 'invalid'
  if (totalSize <= 0) return 'invalid'

  if (!rawStart && rawEnd) {
    const suffixLength = Number(rawEnd)
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return 'invalid'
    const start = Math.max(0, totalSize - suffixLength)
    return { start, end: totalSize - 1 }
  }

  const start = Number(rawStart)
  const end = rawEnd ? Math.min(Number(rawEnd), totalSize - 1) : totalSize - 1
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start > end ||
    start >= totalSize
  ) {
    return 'invalid'
  }
  return { start, end }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } },
) {
  try {
    const resolvedParams = await params
    const pathArray = Array.isArray(resolvedParams?.path) ? resolvedParams.path : []
    const assetsDir = getAssetsDir()
    const legacyPublicAssetsDir = getLegacyPublicAssetsDir()

    const candidates = [resolveWithinRoot(assetsDir, pathArray)]
    if (pathArray[0] === LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY) {
      candidates.push(
        resolveWithinRoot(assetsDir, [LIBRARY_FOLDER_LOGO_DIRECTORY, ...pathArray.slice(1)]),
      )
    }
    candidates.push(resolveWithinRoot(legacyPublicAssetsDir, pathArray))

    if (candidates.every((item) => item === null)) {
      return new NextResponse('Invalid path', { status: 400 })
    }

    const filePath = candidates.find((item): item is string => Boolean(item && fs.existsSync(item)))
    if (!filePath) {
      return new NextResponse('File not found', { status: 404 })
    }

    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      return new NextResponse('Directory access forbidden', { status: 403 })
    }

    const mimeType = getMimeType(filePath)
    const rangeHeader = req.headers.get('range')

    if (rangeHeader) {
      const parsed = parseByteRange(rangeHeader, stat.size)
      if (parsed === 'invalid') {
        return new NextResponse('Requested Range Not Satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${stat.size}`,
            'Accept-Ranges': 'bytes',
          },
        })
      }

      const { start, end } = parsed
      const stream = fs.createReadStream(filePath, { start, end })
      return new NextResponse(toWebStream(stream), {
        status: 206,
        headers: {
          'Content-Type': mimeType,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    const stream = fs.createReadStream(filePath)
    return new NextResponse(toWebStream(stream), {
      headers: {
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving asset:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
