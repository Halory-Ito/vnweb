import { NextResponse } from 'next/server'

import { getEnabledSyncClient } from '@/lib/sync-client'

// 列出远程备份目录
export async function GET() {
  try {
    const client = await getEnabledSyncClient()
    if (!client) {
      return NextResponse.json(
        { error: '同步服务器配置未设置，请先在设置中配置同步服务器' },
        { status: 400 },
      )
    }

    // 测试连接
    const connected = await client.testConnection()
    if (!connected) {
      return NextResponse.json({ error: '无法连接到同步服务器，请检查配置' }, { status: 400 })
    }

    const backups = await client.listBackupDirectories()

    return NextResponse.json({ data: backups })
  } catch (error) {
    console.error('List WebDAV backups failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取远程备份列表失败' },
      { status: 500 },
    )
  }
}
