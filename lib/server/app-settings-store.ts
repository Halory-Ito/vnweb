import fs from 'node:fs/promises'
import path from 'node:path'

import { readConfig } from '@/lib/server/config-rw'
import { getAssetsDir } from '@/lib/server/runtime-paths.mjs'
import {
  extractAppIconFileName,
  normalizeAppSettings,
  type AppSettings,
} from '@/lib/settings/app-settings'

import type { NextRequest } from 'next/server'

export const getAppIconAssetDir = () => path.join(getAssetsDir(), 'app')

export async function readAppSettingsFromConfig(): Promise<AppSettings> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  return normalizeAppSettings(settings['app'])
}

export async function cleanupUnusedAppIcons(settings: AppSettings): Promise<void> {
  const keepNames = new Set<string>()
  for (const candidate of [settings.iconPath, settings.desktopIconPath]) {
    const fileName = extractAppIconFileName(candidate)
    if (fileName) {
      keepNames.add(fileName.toLowerCase())
    }
  }

  const dir = getAppIconAssetDir()
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

function parseRuntimePortValue(raw: string | undefined): number | null {
  if (!raw) return null
  const num = Number(raw.trim())
  return Number.isInteger(num) && num >= 1 && num <= 65535 ? num : null
}

export function resolveRuntimePort(req: NextRequest): number | null {
  const envPort = parseRuntimePortValue(process.env.PORT)
  if (envPort !== null) return envPort

  const nextUrlPort = parseRuntimePortValue(req.nextUrl.port)
  if (nextUrlPort !== null) return nextUrlPort

  const hostHeader = req.headers.get('host')?.trim()
  if (hostHeader) {
    try {
      const parsed = new URL(`http://${hostHeader}`)
      return parseRuntimePortValue(parsed.port)
    } catch {
      return null
    }
  }

  return null
}
