import fs from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } },
) {
  try {
    const resolvedParams = await params
    const pathArray = Array.isArray(resolvedParams?.path)
      ? resolvedParams.path
      : []
    const filePath = path.join(process.cwd(), 'assets', ...pathArray)

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      return new NextResponse('Directory access forbidden', { status: 403 })
    }

    const stream = fs.createReadStream(filePath)
    const mimeType = getMimeType(filePath)

    // @ts-ignore - readable stream to web stream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk))
        stream.on('end', () => controller.close())
        stream.on('error', (err) => controller.error(err))
      },
      cancel() {
        stream.destroy()
      },
    })

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving asset:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
