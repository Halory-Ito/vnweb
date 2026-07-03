import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024 // 500MB

const PV_DIR = path.join(process.cwd(), 'assets', 'pv')

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v']

const getSafeExt = (fileName: string, fileType: string) => {
  const ext = path.extname(fileName).toLowerCase()
  if (ext && VIDEO_EXTENSIONS.includes(ext)) {
    return ext
  }

  const byMime: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogg',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/x-matroska': '.mkv',
  }

  return byMime[fileType] || '.mp4'
}

const uploadPvVideo = async (req: NextRequest) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const gameId = formData.get('gameId')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到上传文件' }, { status: 400 })
    }

    if (!gameId || typeof gameId !== 'string') {
      return NextResponse.json({ error: '缺少 gameId 参数' }, { status: 400 })
    }

    const gameIdNum = Number(gameId)
    if (!Number.isInteger(gameIdNum) || gameIdNum <= 0) {
      return NextResponse.json({ error: '无效的 gameId' }, { status: 400 })
    }

    if (!VIDEO_MIME_TYPES.includes(file.type) && !file.name.match(/\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i)) {
      return NextResponse.json({ error: '仅支持视频文件（mp4、webm、ogg、mov、avi、mkv）' }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: '视频大小需在 1B 到 500MB 之间' },
        { status: 400 },
      )
    }

    const ext = getSafeExt(file.name, file.type)
    const fileName = `${Date.now()}${ext}`
    const targetDir = path.join(PV_DIR, String(gameIdNum))
    const targetPath = path.join(targetDir, fileName)

    await fs.mkdir(targetDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await fs.writeFile(targetPath, Buffer.from(bytes))

    return NextResponse.json({
      data: {
        url: `/assets/pv/${gameIdNum}/${fileName}`,
      },
    })
  } catch (error) {
    console.error('Upload PV video failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '上传视频失败' },
      { status: 500 },
    )
  }
}

export { uploadPvVideo as POST }
