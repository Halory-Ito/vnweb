import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.ttc', '.woff', '.woff2'])

type Payload = {
  sourcePath?: string
}

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom-font'

const normalizePathForCompare = (value: string) =>
  path.resolve(value).replace(/\//g, '\\').toLowerCase()

const getAllowedDirectories = () => {
  const systemDir = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts')
  const userDir = path.join(
    os.homedir(),
    'AppData',
    'Local',
    'Microsoft',
    'Windows',
    'Fonts',
  )

  return [systemDir, userDir]
}

const importLocalFont = async (req: NextRequest) => {
  try {
    if (process.platform !== 'win32') {
      return NextResponse.json(
        { error: '当前仅支持 Windows 字体导入' },
        { status: 400 },
      )
    }

    const body = (await req.json().catch(() => ({}))) as Payload
    const sourcePath = String(body.sourcePath || '').trim()
    if (!sourcePath) {
      return NextResponse.json({ error: '缺少字体路径' }, { status: 400 })
    }

    const resolvedSourcePath = path.resolve(sourcePath)
    const ext = path.extname(resolvedSourcePath).toLowerCase()
    if (!FONT_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: '不支持的字体格式' }, { status: 400 })
    }

    const normalizedSourcePath = normalizePathForCompare(resolvedSourcePath)
    const allowedDirectories = getAllowedDirectories().map((dir) =>
      normalizePathForCompare(dir),
    )
    const isAllowed = allowedDirectories.some(
      (allowedDir) =>
        normalizedSourcePath === allowedDir ||
        normalizedSourcePath.startsWith(`${allowedDir}\\`),
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: '仅允许导入系统字体目录中的文件' },
        { status: 400 },
      )
    }

    await fs.access(resolvedSourcePath)

    const baseName = sanitizeFileName(
      path.basename(resolvedSourcePath, path.extname(resolvedSourcePath)),
    )
    const fileName = `${baseName}_${Date.now()}${ext}`
    const targetDir = path.join(process.cwd(), 'assets', 'fonts')
    const targetPath = path.join(targetDir, fileName)

    await fs.mkdir(targetDir, { recursive: true })
    await fs.copyFile(resolvedSourcePath, targetPath)

    return NextResponse.json({
      data: {
        path: `/fonts/${fileName}`,
        name: baseName,
      },
    })
  } catch (error) {
    console.error('Import local font failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '导入字体失败' },
      { status: 500 },
    )
  }
}

export { importLocalFont as POST }
