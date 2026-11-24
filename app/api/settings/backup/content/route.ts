import { NextRequest, NextResponse } from 'next/server'

import { normalizeBackupContentOptions } from '@/lib/backup-content'
import { readBackupContentConfig, writeBackupContentConfig } from '@/lib/server/config-rw'

export async function GET() {
  try {
    const options = await readBackupContentConfig()
    return NextResponse.json({ data: options })
  } catch (error) {
    console.error('Get backup content config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取备份内容配置失败' },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const rawContent = body && typeof body === 'object' && 'content' in body ? body.content : body
    const options = normalizeBackupContentOptions(rawContent)
    await writeBackupContentConfig(options)
    return NextResponse.json({ data: options })
  } catch (error) {
    console.error('Update backup content config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '保存备份内容配置失败' },
      { status: 500 },
    )
  }
}
