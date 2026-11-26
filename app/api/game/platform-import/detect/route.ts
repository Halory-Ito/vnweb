import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

import type { PlatformDetectedPath } from '@/types/platform-import'

export const dynamic = 'force-dynamic'

export async function GET() {
  const appData = (process.env.APPDATA || '').trim()
  const items: PlatformDetectedPath[] = []

  if (appData) {
    const playniteLibrary = path.join(appData, 'Playnite', 'library')
    const playniteRoot = path.join(appData, 'Playnite')
    const playnitePath = fs.existsSync(path.join(playniteLibrary, 'games.db'))
      ? playniteLibrary
      : playniteRoot

    items.push({
      platform: 'playnite',
      path: playnitePath,
      exists: fs.existsSync(path.join(playnitePath, 'games.db')),
    })

    const vniteDbPath = path.join(appData, 'vnite', 'app', 'database')
    items.push({
      platform: 'vnite',
      path: vniteDbPath,
      exists: fs.existsSync(path.join(vniteDbPath, 'game')),
    })
  }

  return NextResponse.json({
    data: { items },
  })
}
