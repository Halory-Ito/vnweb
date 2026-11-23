import { NextRequest, NextResponse } from 'next/server'

import { readSyncStoreNode } from '@/lib/server/sync-config-store'
import { createSyncClient, toConnectionConfig } from '@/lib/sync-client'

import type { SyncServerConfig } from '@/types'

const PASSWORD_MASK = '********'

// 测试同步服务器连接
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const provider = body.provider === 's3' ? 's3' : 'webdav'

    if (provider === 's3' && (!body.endpoint || !body.bucket)) {
      return NextResponse.json({ error: '请填写 S3 服务地址与存储桶名称' }, { status: 400 })
    }
    if (provider === 'webdav' && !body.server) {
      return NextResponse.json({ error: '服务器地址为必填项' }, { status: 400 })
    }

    // 密码占位符：从已保存配置中读取真实密码
    let password = typeof body.password === 'string' ? body.password : ''
    let secretAccessKey = typeof body.secretAccessKey === 'string' ? body.secretAccessKey : ''
    if ((password === PASSWORD_MASK || secretAccessKey === PASSWORD_MASK) && body.id) {
      const syncNode = await readSyncStoreNode()
      const configs = Array.isArray(syncNode.configs)
        ? (syncNode.configs as SyncServerConfig[])
        : []
      const saved = configs.find((item) => item?.id === body.id)
      if (saved) {
        if (password === PASSWORD_MASK) password = saved.password || ''
        if (secretAccessKey === PASSWORD_MASK) secretAccessKey = saved.secretAccessKey || ''
      }
    }

    const config = toConnectionConfig({
      id: typeof body.id === 'string' ? body.id : '',
      name: '',
      provider,
      enabled: false,
      remotePath: typeof body.remotePath === 'string' ? body.remotePath : '/vnweb-backup',
      server: typeof body.server === 'string' ? body.server : '',
      username: typeof body.username === 'string' ? body.username : '',
      password,
      endpoint: typeof body.endpoint === 'string' ? body.endpoint : '',
      bucket: typeof body.bucket === 'string' ? body.bucket : '',
      region: typeof body.region === 'string' ? body.region : '',
      accessKeyId: typeof body.accessKeyId === 'string' ? body.accessKeyId : '',
      secretAccessKey,
      forcePathStyle: body.forcePathStyle === true,
    })

    const client = createSyncClient(config)
    const connected = await client.testConnection()

    if (!connected) {
      return NextResponse.json({ error: '无法连接到同步服务器，请检查配置' }, { status: 400 })
    }

    return NextResponse.json({ data: { connected: true, message: '连接成功' } })
  } catch (error) {
    console.error('Sync connection test failed:', error)
    return NextResponse.json({ error: (error as Error).message || '测试连接失败' }, { status: 500 })
  }
}
