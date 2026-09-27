import { NextRequest, NextResponse } from 'next/server'

import { getWebDAVConfig, WebDAVClient, WebDAVConfig } from '@/lib/webdav-utils'

// 测试WebDAV连接
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { server, username, password, remotePath } = body

    if (!server) {
      return NextResponse.json({ error: '服务器地址为必填项' }, { status: 400 })
    }

    // 密码占位符：如果前端传入 '********'，说明密码未修改，
    // 需要从已保存的配置中读取真实密码
    let realPassword = password || ''
    if (password === '********') {
      const savedConfig = await getWebDAVConfig()
      realPassword = savedConfig?.password || ''
    }

    const config: WebDAVConfig = {
      server,
      username: username || '',
      password: realPassword,
      remotePath: remotePath || '/vnweb-backup',
    }

    const client = new WebDAVClient(config)
    const connected = await client.testConnection()

    if (!connected) {
      return NextResponse.json({ error: '无法连接到WebDAV服务器，请检查配置' }, { status: 400 })
    }

    return NextResponse.json({
      data: { connected: true, message: '连接成功' },
    })
  } catch (error) {
    console.error('WebDAV test failed:', error)
    return NextResponse.json({ error: (error as Error).message || '测试连接失败' }, { status: 500 })
  }
}
