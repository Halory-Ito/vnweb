import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'
import { getAssetsDir } from '@/lib/server/runtime-paths.mjs'
import {
  isSafeStartupMediaPath,
  normalizeStartupSettings,
  type StartupMediaKind,
  type StartupSettings,
  type StartupSettingsPatch,
} from '@/lib/settings/startup-settings'
import { extractStartupFileName, isValidStartupMediaName } from '@/lib/settings/startup-upload-name'

const getStartupAssetDir = () => path.join(getAssetsDir(), 'startup')

async function readStartupSettingsFromConfig(): Promise<StartupSettings> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const startup = (appearance['startup'] || {}) as Record<string, unknown>
  return normalizeStartupSettings(startup)
}

async function cleanupUnusedStartupAssets(settings: StartupSettings): Promise<void> {
  const keepNames = new Set<string>()
  for (const candidatePath of [settings.image.mediaPath, settings.video.mediaPath]) {
    const fileName = extractStartupFileName(candidatePath)
    if (fileName) {
      keepNames.add(fileName.toLowerCase())
    }
  }

  const dir = getStartupAssetDir()
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && !keepNames.has(entry.name.toLowerCase())) {
        await fs.unlink(path.join(dir, entry.name)).catch(() => {})
      }
    }
  } catch {
    // Directory may not exist yet.
  }
}

function mergeSlotPatch<
  T extends { mediaPath: string; mediaWidth: number | null; mediaHeight: number | null },
>(currentSlot: T, patchSlot: Partial<T> | undefined): T {
  if (!patchSlot) return currentSlot
  const mediaPathChanged =
    patchSlot.mediaPath !== undefined && patchSlot.mediaPath !== currentSlot.mediaPath

  return {
    ...currentSlot,
    ...patchSlot,
    mediaWidth:
      patchSlot.mediaWidth !== undefined
        ? patchSlot.mediaWidth
        : mediaPathChanged
          ? null
          : currentSlot.mediaWidth,
    mediaHeight:
      patchSlot.mediaHeight !== undefined
        ? patchSlot.mediaHeight
        : mediaPathChanged
          ? null
          : currentSlot.mediaHeight,
  }
}

export async function GET() {
  try {
    const data = await readStartupSettingsFromConfig()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get startup settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取启动动画设置失败' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as StartupSettingsPatch &
      Record<string, unknown>
    const current = await readStartupSettingsFromConfig()

    let next: StartupSettings
    if (
      'image' in body ||
      'video' in body ||
      'activeType' in body ||
      (!('mediaPath' in body) && !('mediaType' in body))
    ) {
      next = normalizeStartupSettings({
        enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
        activeType: body.activeType ?? current.activeType,
        image: mergeSlotPatch(current.image, body.image),
        video: mergeSlotPatch(current.video, body.video),
      })
    } else {
      const targetKind: StartupMediaKind =
        body.mediaType === 'video'
          ? 'video'
          : body.mediaType === 'image'
            ? 'image'
            : current.activeType
      const targetPatch = {
        mediaPath: typeof body.mediaPath === 'string' ? body.mediaPath : undefined,
        mediaWidth: body.mediaWidth as number | null | undefined,
        mediaHeight: body.mediaHeight as number | null | undefined,
        matchMediaWindowSize:
          typeof body.matchMediaWindowSize === 'boolean' ? body.matchMediaWindowSize : undefined,
        durationMs: typeof body.durationMs === 'number' ? body.durationMs : undefined,
        muted: typeof body.muted === 'boolean' ? body.muted : undefined,
        skippable: typeof body.skippable === 'boolean' ? body.skippable : undefined,
      }
      next = normalizeStartupSettings({
        enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
        activeType: targetKind,
        image: targetKind === 'image' ? mergeSlotPatch(current.image, targetPatch) : current.image,
        video: targetKind === 'video' ? mergeSlotPatch(current.video, targetPatch) : current.video,
      })
    }

    await updateConfigSection(['settings', 'appearance', 'startup'], next)
    await cleanupUnusedStartupAssets(next)

    return NextResponse.json({ data: next })
  } catch (error) {
    console.error('Update startup settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '保存启动动画设置失败' },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      mediaType?: unknown
      name?: unknown
    }
    const requestedName = typeof body.name === 'string' ? body.name.trim() : ''
    if (!requestedName || !isValidStartupMediaName(requestedName)) {
      return NextResponse.json(
        { error: '文件名只能包含文字、数字、空格、连字符和下划线，最多 60 字' },
        { status: 400 },
      )
    }

    const current = await readStartupSettingsFromConfig()
    const targetKind: StartupMediaKind =
      body.mediaType === 'image' || body.mediaType === 'video' ? body.mediaType : current.activeType
    const slotConfig = current[targetKind]

    if (!slotConfig.mediaPath || !isSafeStartupMediaPath(slotConfig.mediaPath)) {
      return NextResponse.json({ error: '当前没有可重命名的启动动画素材' }, { status: 400 })
    }

    const currentFileName = extractStartupFileName(slotConfig.mediaPath)
    if (
      !currentFileName ||
      currentFileName === '.' ||
      currentFileName === '..' ||
      currentFileName.includes('/') ||
      currentFileName.includes('\\') ||
      currentFileName.includes('..')
    ) {
      return NextResponse.json({ error: '启动动画文件路径无效' }, { status: 400 })
    }

    const ext = path.extname(currentFileName).toLowerCase()
    const nextFileName = `${requestedName}${ext}`
    const otherSlot = targetKind === 'image' ? current.video : current.image
    const otherFileName = extractStartupFileName(otherSlot.mediaPath)
    if (otherFileName && otherFileName.toLowerCase() === nextFileName.toLowerCase()) {
      return NextResponse.json({ error: '文件名与另一项启动动画素材冲突' }, { status: 400 })
    }

    const dir = getStartupAssetDir()
    const oldPath = path.join(dir, currentFileName)
    const nextPath = path.join(dir, nextFileName)

    const stat = await fs.stat(oldPath).catch(() => null)
    if (!stat?.isFile()) {
      return NextResponse.json({ error: '未找到当前启动动画文件' }, { status: 404 })
    }

    if (currentFileName !== nextFileName) {
      if (currentFileName.toLowerCase() === nextFileName.toLowerCase()) {
        const tempPath = path.join(dir, `.rename-${randomUUID()}${ext}`)
        await fs.rename(oldPath, tempPath)
        await fs.rename(tempPath, nextPath)
      } else {
        await fs.rm(nextPath, { force: true }).catch(() => {})
        await fs.rename(oldPath, nextPath)
      }
    }

    const next = normalizeStartupSettings({
      ...current,
      [targetKind]: {
        ...slotConfig,
        mediaPath: `/assets/startup/${nextFileName}?v=${randomUUID()}`,
      },
    })
    await updateConfigSection(['settings', 'appearance', 'startup'], next)

    return NextResponse.json({ data: next })
  } catch (error) {
    console.error('Rename startup animation failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '重命名启动动画失败' },
      { status: 500 },
    )
  }
}
