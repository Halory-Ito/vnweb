import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024

const CUSTOM_BG_DIR = path.join(process.cwd(), 'assets', 'bg', 'custom')

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

const removeOldCustomBackgrounds = async (device: 'pc' | 'mobile') => {
  try {
    const entries = await fs.readdir(CUSTOM_BG_DIR)
    for (const entry of entries) {
      // 只删除对应设备的旧背景（以设备类型开头的文件）
      if (entry.startsWith(`${device}-`)) {
        const filePath = path.join(CUSTOM_BG_DIR, entry)
        const stat = await fs.stat(filePath)
        if (stat.isFile()) {
          await fs.unlink(filePath)
        }
      }
    }
  } catch {
    // Directory may not exist yet; that's fine.
  }
}

const uploadBackgroundImage = async (req: NextRequest) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const device = formData.get('device') as string

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

    // 验证设备类型
    const deviceType = device === 'mobile' ? 'mobile' : 'pc'

    const ext = getSafeExt(file.name, file.type)
    const fileName = `${deviceType}-${Date.now()}${ext}`
    const targetPath = path.join(CUSTOM_BG_DIR, fileName)

    await fs.mkdir(CUSTOM_BG_DIR, { recursive: true })
    await removeOldCustomBackgrounds(deviceType)

    const bytes = await file.arrayBuffer()
    await fs.writeFile(targetPath, Buffer.from(bytes))

    return NextResponse.json({
      data: {
        path: `/assets/bg/custom/${fileName}`,
        device: deviceType,
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
