import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { readConfig } from '@/lib/server/config-rw'
import { getAssetsDir } from '@/lib/server/runtime-paths.mjs'
import { normalizeStartupSettings } from '@/lib/settings/startup-settings'
import {
  extractStartupFileName,
  isValidStartupMediaName,
  resolveStartupMediaMeta,
} from '@/lib/settings/startup-upload-name'

const MAX_IMAGE_SIZE = 20 * 1024 * 1024
const MAX_VIDEO_SIZE = 200 * 1024 * 1024

const getStartupAssetDir = () => path.join(getAssetsDir(), 'startup')

async function cleanupUnusedStartupAssets(keepFileNames: Set<string>) {
  const dir = getStartupAssetDir()
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && !keepFileNames.has(entry.name.toLowerCase())) {
        await fs.unlink(path.join(dir, entry.name)).catch(() => {})
      }
    }
  } catch {
    // Ignore missing directory.
  }
}

let uploadQueue = Promise.resolve()

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const requestedName = formData.get('name')
    const requestedMediaType = formData.get('mediaType')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到上传文件' }, { status: 400 })
    }

    const mediaMeta = resolveStartupMediaMeta(file.name, file.type)
    if (!mediaMeta) {
      return NextResponse.json(
        { error: '仅支持常见图片（PNG/JPG/WebP/GIF/AVIF/SVG）或视频（MP4/WebM/OGG/MOV/M4V）' },
        { status: 400 },
      )
    }

    if (
      (requestedMediaType === 'image' || requestedMediaType === 'video') &&
      mediaMeta.mediaType !== requestedMediaType
    ) {
      return NextResponse.json(
        { error: requestedMediaType === 'image' ? '仅支持上传图片文件' : '仅支持上传视频文件' },
        { status: 400 },
      )
    }

    const maxSize = mediaMeta.mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size <= 0 || file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            mediaMeta.mediaType === 'video' ? '视频大小不能超过 200MB' : '图片大小不能超过 20MB',
        },
        { status: 400 },
      )
    }

    const name = typeof requestedName === 'string' ? requestedName.trim() : ''
    if (
      (requestedName !== null && typeof requestedName !== 'string') ||
      !isValidStartupMediaName(name)
    ) {
      return NextResponse.json(
        { error: '文件名只能包含文字、数字、空格、连字符和下划线，最多 60 字' },
        { status: 400 },
      )
    }

    const dir = getStartupAssetDir()
    const fileName = `${name || `startup-${Date.now()}`}${mediaMeta.ext}`
    const targetPath = path.join(dir, fileName)
    const version = randomUUID()
    const bytes = Buffer.from(await file.arrayBuffer())

    const task = uploadQueue.then(async () => {
      const tempPath = path.join(dir, `.${version}.tmp`)
      await fs.mkdir(dir, { recursive: true })
      try {
        await fs.writeFile(tempPath, bytes, { flag: 'wx' })
        await fs.rename(tempPath, targetPath)
      } finally {
        await fs.rm(tempPath, { force: true }).catch(() => {})
      }

      const fullConfig = await readConfig()
      const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
      const appearance = (settings['appearance'] || {}) as Record<string, unknown>
      const currentStartup = normalizeStartupSettings(
        appearance['startup'] as Record<string, unknown> | undefined,
      )
      const otherSlot =
        mediaMeta.mediaType === 'image' ? currentStartup.video : currentStartup.image
      const otherFileName = extractStartupFileName(otherSlot.mediaPath)

      const keepFileNames = new Set([fileName.toLowerCase()])
      if (otherFileName) {
        keepFileNames.add(otherFileName.toLowerCase())
      }
      await cleanupUnusedStartupAssets(keepFileNames)
    })
    uploadQueue = task.catch(() => {})
    await task

    return NextResponse.json({
      data: {
        path: `/assets/startup/${fileName}?v=${version}`,
        mediaType: mediaMeta.mediaType,
      },
    })
  } catch (error) {
    console.error('Upload startup animation failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '上传启动动画失败' },
      { status: 500 },
    )
  }
}
