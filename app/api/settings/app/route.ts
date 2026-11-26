import { NextRequest, NextResponse } from 'next/server'

import {
  cleanupUnusedAppIcons,
  readAppSettingsFromConfig,
  resolveRuntimePort,
} from '@/lib/server/app-settings-store'
import { updateConfigSection } from '@/lib/server/config-rw'
import {
  APP_NAME_MAX_LENGTH,
  hasControlCharacters,
  isSafeAppIconPath,
  isSafeDesktopIconPath,
  isValidAppPort,
  MAX_APP_PORT,
  MIN_APP_PORT,
  normalizeAppName,
  normalizeAppSettings,
} from '@/lib/settings/app-settings'

export async function GET(req: NextRequest) {
  try {
    const data = await readAppSettingsFromConfig()
    return NextResponse.json({
      data,
      runtimePort: resolveRuntimePort(req),
    })
  } catch (error) {
    console.error('Get app settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '读取通用设置失败' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = (await req.json().catch(() => null)) as unknown
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ error: '无效的请求参数' }, { status: 400 })
    }

    const body = rawBody as Record<string, unknown>
    const current = await readAppSettingsFromConfig()
    const merged: Record<string, unknown> = { ...current }

    if ('name' in body && body.name !== undefined) {
      if (typeof body.name !== 'string' || hasControlCharacters(body.name)) {
        return NextResponse.json({ error: '软件名称格式无效' }, { status: 400 })
      }
      const trimmedName = body.name.trim()
      if (trimmedName.length > APP_NAME_MAX_LENGTH) {
        return NextResponse.json(
          { error: `软件名称最多 ${APP_NAME_MAX_LENGTH} 个字符` },
          { status: 400 },
        )
      }
      merged.name = normalizeAppName(trimmedName)
    }

    if ('port' in body && body.port !== undefined) {
      if (typeof body.port !== 'number' || !isValidAppPort(body.port)) {
        return NextResponse.json(
          { error: `端口号必须是 ${MIN_APP_PORT} 至 ${MAX_APP_PORT} 之间的整数` },
          { status: 400 },
        )
      }
      merged.port = body.port
    }

    if ('iconPath' in body && body.iconPath !== undefined) {
      if (typeof body.iconPath !== 'string') {
        return NextResponse.json({ error: '图标路径格式无效' }, { status: 400 })
      }
      const trimmedIcon = body.iconPath.trim()
      if (trimmedIcon && !isSafeAppIconPath(trimmedIcon)) {
        return NextResponse.json({ error: '图标路径无效' }, { status: 400 })
      }
      merged.iconPath = trimmedIcon
      if (!trimmedIcon) {
        merged.desktopIconPath = ''
      }
    }

    if ('desktopIconPath' in body && body.desktopIconPath !== undefined) {
      if (typeof body.desktopIconPath !== 'string') {
        return NextResponse.json({ error: '桌面图标路径格式无效' }, { status: 400 })
      }
      const trimmedDesktopIcon = body.desktopIconPath.trim()
      if (trimmedDesktopIcon && !isSafeDesktopIconPath(trimmedDesktopIcon)) {
        return NextResponse.json({ error: '桌面图标路径无效' }, { status: 400 })
      }
      merged.desktopIconPath = trimmedDesktopIcon
    }

    const next = normalizeAppSettings(merged)
    await updateConfigSection(['settings', 'app'], next)
    await cleanupUnusedAppIcons(next)

    return NextResponse.json({
      data: next,
      runtimePort: resolveRuntimePort(req),
    })
  } catch (error) {
    console.error('Update app settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '保存通用设置失败' },
      { status: 500 },
    )
  }
}
