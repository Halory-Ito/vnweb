import { NextResponse } from 'next/server'

import { collectRemoteBackupStatus } from '@/lib/server/sync-backup-meta'
import { getEnabledSyncClient, getEnabledSyncConfig } from '@/lib/sync-client'

export async function GET() {
  try {
    const client = await getEnabledSyncClient()
    const syncConfig = await getEnabledSyncConfig()
    if (!client || !syncConfig) {
      return NextResponse.json({ data: { exists: false } })
    }

    const connected = await client.testConnection()
    if (!connected) {
      return NextResponse.json({ error: '无法连接到同步服务器，请检查配置' }, { status: 400 })
    }

    const remoteRoot = (syncConfig.remotePath || '/vnweb-backup').replace(/\/+$/g, '')
    const status = await collectRemoteBackupStatus(client, remoteRoot)
    return NextResponse.json({ data: status })
  } catch (error) {
    console.error('Check remote backup status failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '检测远端备份日期失败' },
      { status: 500 },
    )
  }
}
