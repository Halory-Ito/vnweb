import { NextResponse } from 'next/server'

import { collectRemoteDownloadPreview } from '@/lib/server/sync-backup-meta'
import { getEnabledSyncClient, getEnabledSyncConfig } from '@/lib/sync-client'

export async function GET() {
  try {
    const client = await getEnabledSyncClient()
    const syncConfig = await getEnabledSyncConfig()
    if (!client || !syncConfig) {
      return NextResponse.json(
        { error: '同步服务器配置未设置，请先在设置中配置同步服务器' },
        { status: 400 },
      )
    }

    const connected = await client.testConnection()
    if (!connected) {
      return NextResponse.json({ error: '无法连接到同步服务器，请检查配置' }, { status: 400 })
    }

    const remoteRoot = (syncConfig.remotePath || '/vnweb-backup').replace(/\/+$/g, '')
    const summary = await collectRemoteDownloadPreview(client, remoteRoot)
    return NextResponse.json({ data: summary })
  } catch (error) {
    console.error('Collect remote download preview failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取远端备份统计失败' },
      { status: 500 },
    )
  }
}
