import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

// WebDAV配置文件路径
function getConfigPath() {
  return path.join(process.cwd(), 'app', 'webdav-config.json')
}

// 默认WebDAV配置
const DEFAULT_CONFIG = {
  server: '',
  username: '',
  password: '',
  remotePath: '/vnweb-backup',
  autoBackup: false,
  autoBackupInterval: 24, // 小时
}

// 获取WebDAV配置
export async function GET() {
  try {
    const configPath = getConfigPath()
    let config = DEFAULT_CONFIG

    if (fs.existsSync(configPath)) {
      const content = await fs.promises.readFile(configPath, 'utf-8')
      config = { ...DEFAULT_CONFIG, ...JSON.parse(content) }
    }

    // 不返回密码明文
    const safeConfig = {
      ...config,
      password: config.password ? '********' : '',
    }

    return NextResponse.json({ data: safeConfig })
  } catch (error) {
    console.error('Get WebDAV config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取WebDAV配置失败' },
      { status: 500 },
    )
  }
}

// 保存WebDAV配置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { server, username, password, remotePath, autoBackup, autoBackupInterval } = body

    // 验证必填字段
    if (!server) {
      return NextResponse.json({ error: '服务器地址为必填项' }, { status: 400 })
    }

    // 读取现有配置（保留密码如果没有提供新密码）
    const configPath = getConfigPath()
    let existingConfig = DEFAULT_CONFIG
    if (fs.existsSync(configPath)) {
      const content = await fs.promises.readFile(configPath, 'utf-8')
      existingConfig = JSON.parse(content)
    }

    // 更新配置
    const newConfig = {
      server: server || existingConfig.server,
      username: username || existingConfig.username,
      password: password === '********' ? existingConfig.password : password || '',
      remotePath: remotePath || existingConfig.remotePath,
      autoBackup: autoBackup !== undefined ? autoBackup : existingConfig.autoBackup,
      autoBackupInterval: autoBackupInterval || existingConfig.autoBackupInterval,
    }

    // 保存配置
    await fs.promises.writeFile(configPath, JSON.stringify(newConfig, null, 2))

    return NextResponse.json({
      data: {
        ...newConfig,
        password: newConfig.password ? '********' : '',
      },
    })
  } catch (error) {
    console.error('Save WebDAV config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '保存WebDAV配置失败' },
      { status: 500 },
    )
  }
}
