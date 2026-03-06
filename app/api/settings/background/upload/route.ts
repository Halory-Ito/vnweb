import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'background'

const getSafeExt = (fileName: string, fileType: string) => {
  const ext = path.extname(fileName).toLowerCase()
  if (ext && /^[.][a-z0-9]{1,10}$/.test(ext)) {
    return ext
  }

  const byMime: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/svg+xml': '.svg',
  }

  return byMime[fileType] || '.png'
}

const uploadBackgroundImage = async (req: NextRequest) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到上传文件' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '仅支持图片文件' }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: '图片大小需在 1B 到 20MB 之间' },
        { status: 400 },
      )
    }

    const ext = getSafeExt(file.name, file.type)
    const baseName = sanitizeFileName(
      path.basename(file.name, path.extname(file.name)),
    )
    const fileName = `${baseName}_${Date.now()}${ext}`
    const targetDir = path.join(
      process.cwd(),
      'public',
      'assets',
      'bg',
      'custom',
    )
    const targetPath = path.join(targetDir, fileName)

    await fs.mkdir(targetDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await fs.writeFile(targetPath, Buffer.from(bytes))

    return NextResponse.json({
      data: {
        path: `/assets/bg/custom/${fileName}`,
      },
    })
  } catch (error) {
    console.error('Upload background image failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '上传背景图片失败' },
      { status: 500 },
    )
  }
}

export { uploadBackgroundImage as POST }
