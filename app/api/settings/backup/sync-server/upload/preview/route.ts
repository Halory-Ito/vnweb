import { NextResponse } from 'next/server'

import { collectSyncUploadSummary } from '@/lib/server/sync-backup-summary'

export async function GET() {
  try {
    const summary = await collectSyncUploadSummary()
    return NextResponse.json({ data: summary })
  } catch (error) {
    console.error('Collect sync upload preview failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取上传备份统计失败' },
      { status: 500 },
    )
  }
}
