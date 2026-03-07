import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.ttc', '.woff', '.woff2'])

type FontSource = 'system' | 'user'

const getFontDirectories = () => {
  const systemDir = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts')
  const userDir = path.join(
    os.homedir(),
    'AppData',
    'Local',
    'Microsoft',
    'Windows',
    'Fonts',
  )

  return [
    { dir: systemDir, source: 'system' as FontSource },
    { dir: userDir, source: 'user' as FontSource },
  ]
}

const listLocalFonts = async () => {
  try {
    if (process.platform !== 'win32') {
      return NextResponse.json(
        { error: '当前仅支持 Windows 字体目录扫描' },
        { status: 400 },
      )
    }

    const allFonts: Array<{
      name: string
      path: string
      source: FontSource
    }> = []

    for (const { dir, source } of getFontDirectories()) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })

        for (const entry of entries) {
          if (!entry.isFile()) {
            continue
          }

          const ext = path.extname(entry.name).toLowerCase()
          if (!FONT_EXTENSIONS.has(ext)) {
            continue
          }

          const name = path.basename(entry.name, ext)
          allFonts.push({
            name,
            path: path.join(dir, entry.name),
            source,
          })
        }
      } catch {
        // Ignore inaccessible directories and continue scanning remaining paths.
      }
    }

    allFonts.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

    return NextResponse.json({
      data: allFonts,
    })
  } catch (error) {
    console.error('List local fonts failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '读取本地字体失败' },
      { status: 500 },
    )
  }
}

export { listLocalFonts as GET }
