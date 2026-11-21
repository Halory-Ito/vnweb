import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  getBackgroundImageExtension,
  isValidBackgroundName,
} from '@/lib/settings/background-upload-name'

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024

const CUSTOM_BG_DIR = path.join(process.cwd(), 'assets', 'bg', 'custom')

const removeOldCustomBackgrounds = async (device: 'pc' | 'mobile', filename: string) => {
  try {
    const entries = await fs.readdir(CUSTOM_BG_DIR)
    for (const entry of entries) {
      // 只删除对应设备的旧背景（以设备类型开头的文件）
      if (entry.startsWith(`${device}-`) && entry.toLowerCase() !== filename.toLowerCase()) {
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

let uploadQueue = Promise.resolve()

const uploadBackgroundImage = async (req: NextRequest) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const device = formData.get('device') as string
    const requestedName = formData.get('name')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到上传文件' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '仅支持图片文件' }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: '图片大小需在 1B 到 20MB 之间' }, { status: 400 })
    }

    // 验证设备类型
    const deviceType = device === 'mobile' ? 'mobile' : 'pc'

    const name = typeof requestedName === 'string' ? requestedName.trim() : ''
    if (
      (requestedName !== null && typeof requestedName !== 'string') ||
      !isValidBackgroundName(name)
    ) {
      return NextResponse.json(
        { error: '图片名称只能包含文字、数字、空格、连字符和下划线，最多 60 字' },
        { status: 400 },
      )
    }
    const ext = getBackgroundImageExtension(file.name, file.type)
    const fileName = `${deviceType}-${name || Date.now()}${ext}`
    const targetPath = path.join(CUSTOM_BG_DIR, fileName)

    const version = randomUUID()
    const bytes = Buffer.from(await file.arrayBuffer())
    const save = uploadQueue.then(async () => {
      const temporaryPath = path.join(CUSTOM_BG_DIR, `.${version}.tmp`)
      await fs.mkdir(CUSTOM_BG_DIR, { recursive: true })
      try {
        await fs.writeFile(temporaryPath, bytes, { flag: 'wx' })
        await fs.rename(temporaryPath, targetPath)
      } finally {
        await fs.rm(temporaryPath, { force: true }).catch(() => {})
      }
      await removeOldCustomBackgrounds(deviceType, fileName)
    })
    uploadQueue = save.catch(() => {})
    await save

    return NextResponse.json({
      data: {
        path: `/assets/bg/custom/${fileName}?v=${version}`,
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
