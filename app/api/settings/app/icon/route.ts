import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  cleanupUnusedAppIcons,
  getAppIconAssetDir,
  readAppSettingsFromConfig,
  resolveRuntimePort,
} from '@/lib/server/app-settings-store'
import { updateConfigSection } from '@/lib/server/config-rw'
import { ALLOWED_APP_ICON_EXTENSIONS, normalizeAppSettings } from '@/lib/settings/app-settings'

const MAX_APP_ICON_SIZE = 5 * 1024 * 1024

const MIME_TO_EXT: Record<string, (typeof ALLOWED_APP_ICON_EXTENSIONS)[number]> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/avif': '.avif',
  'image/bmp': '.bmp',
}

function isPngBuffer(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
}

function resolveAppIconExt(file: File): string | null {
  const mime = file.type.trim().toLowerCase()
  if (mime && mime !== 'application/octet-stream' && !mime.startsWith('image/')) {
    return null
  }
  const nameExt = path.extname(file.name).toLowerCase()
  if ((ALLOWED_APP_ICON_EXTENSIONS as readonly string[]).includes(nameExt)) {
    return nameExt
  }
  return MIME_TO_EXT[mime] ?? null
}

async function writeFileAtomic(targetPath: string, bytes: Buffer): Promise<void> {
  const dir = path.dirname(targetPath)
  const tempPath = path.join(dir, `.${randomUUID()}.tmp`)
  await fs.mkdir(dir, { recursive: true })
  try {
    await fs.writeFile(tempPath, bytes, { flag: 'wx' })
    await fs.rename(tempPath, targetPath)
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => {})
  }
}

let iconQueue = Promise.resolve()

function enqueueIconOp<T>(fn: () => Promise<T>): Promise<T> {
  const task = iconQueue.then(fn, fn)
  iconQueue = task.then(
    () => undefined,
    () => undefined,
  )
  return task
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const desktopIconEntry = formData.get('desktopIcon')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到上传图标文件' }, { status: 400 })
    }

    const ext = resolveAppIconExt(file)
    if (!ext) {
      return NextResponse.json(
        { error: '仅支持 PNG、JPG、WebP、GIF、SVG、ICO、AVIF 或 BMP 图片' },
        { status: 400 },
      )
    }

    if (file.size <= 0 || file.size > MAX_APP_ICON_SIZE) {
      return NextResponse.json({ error: '图标文件大小需在 1B 到 5MB 之间' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    let desktopBytes: Buffer | null = null

    if (desktopIconEntry !== null) {
      if (!(desktopIconEntry instanceof File)) {
        return NextResponse.json({ error: '桌面图标格式无效' }, { status: 400 })
      }
      if (desktopIconEntry.size <= 0 || desktopIconEntry.size > MAX_APP_ICON_SIZE) {
        return NextResponse.json({ error: '桌面图标大小需在 1B 到 5MB 之间' }, { status: 400 })
      }
      const parsedDesktop = Buffer.from(await desktopIconEntry.arrayBuffer())
      if (!isPngBuffer(parsedDesktop)) {
        return NextResponse.json({ error: '桌面图标必须是有效的 PNG 图像' }, { status: 400 })
      }
      desktopBytes = parsedDesktop
    }

    const next = await enqueueIconOp(async () => {
      const version = randomUUID()
      const dir = getAppIconAssetDir()
      const iconFileName = `icon-${version}${ext}`
      await writeFileAtomic(path.join(dir, iconFileName), bytes)
      const iconPath = `/assets/app/${iconFileName}?v=${version}`

      let desktopIconPath = ''
      if (desktopBytes) {
        const desktopFileName = `desktop-icon-${version}.png`
        await writeFileAtomic(path.join(dir, desktopFileName), desktopBytes)
        desktopIconPath = `/assets/app/${desktopFileName}?v=${version}`
      } else if (ext === '.png' && isPngBuffer(bytes)) {
        desktopIconPath = iconPath
      }

      const current = await readAppSettingsFromConfig()
      const updated = normalizeAppSettings({
        ...current,
        iconPath,
        desktopIconPath,
      })
      await updateConfigSection(['settings', 'app'], updated)
      await cleanupUnusedAppIcons(updated)
      return updated
    })

    return NextResponse.json({
      data: next,
      runtimePort: resolveRuntimePort(req),
    })
  } catch (error) {
    console.error('Upload app icon failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '上传软件图标失败' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const next = await enqueueIconOp(async () => {
      const current = await readAppSettingsFromConfig()
      const updated = normalizeAppSettings({
        ...current,
        iconPath: '',
        desktopIconPath: '',
      })
      await updateConfigSection(['settings', 'app'], updated)
      await cleanupUnusedAppIcons(updated)
      return updated
    })

    return NextResponse.json({
      data: next,
      runtimePort: resolveRuntimePort(req),
    })
  } catch (error) {
    console.error('Reset app icon failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '恢复默认图标失败' },
      { status: 500 },
    )
  }
}
