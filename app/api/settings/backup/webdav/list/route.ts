import { NextResponse } from 'next/server'

import { getWebDAVConfig, WebDAVClient } from '@/lib/webdav-utils'

// 列出远程备份目录
export async function GET() {
  try {
    const config = await getWebDAVConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'WebDAV配置未设置，请先在设置中配置WebDAV' },
        { status: 400 },
      )
    }

    const client = new WebDAVClient(config)

    // 测试连接
    const connected = await client.testConnection()
    if (!connected) {
      return NextResponse.json({ error: '无法连接到WebDAV服务器，请检查配置' }, { status: 400 })
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
