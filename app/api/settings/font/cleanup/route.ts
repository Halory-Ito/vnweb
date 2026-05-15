import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

type Payload = {
  paths?: string[]
}

const isSafeFontPublicPath = (value: string) =>
  /^\/fonts\/[a-zA-Z0-9._-]+$/.test(value)

const cleanupPreviewFonts = async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as Payload
    const rawPaths = Array.isArray(body.paths) ? body.paths : []
    const paths = Array.from(
      new Set(
        rawPaths
          .map((item) => String(item || '').trim())
          .filter((item) => isSafeFontPublicPath(item)),
      ),
    )

    if (paths.length === 0) {
      return NextResponse.json({ data: { deleted: [] as string[] } })
    }

    const fontsDir = path.join(process.cwd(), 'assets', 'fonts')
    const deleted: string[] = []

    for (const publicPath of paths) {
      const fileName = path.basename(publicPath)
      const targetPath = path.join(fontsDir, fileName)

      try {
        await fs.unlink(targetPath)
        deleted.push(publicPath)
      } catch {
        // Ignore missing or locked files and continue cleanup.
      }
    }

    return NextResponse.json({ data: { deleted } })
  } catch (error) {
    console.error('Cleanup preview fonts failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '清理预览字体失败' },
      { status: 500 },
    )
  }
}

export { cleanupPreviewFonts as POST }
