import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'

const LEGACY_WEBDAV_CONFIG_FILE = path.join(process.cwd(), 'app', 'webdav-config.json')

const DEFAULT_CONFIG = {
  server: '',
  username: '',
  password: '',
  remotePath: '/vnweb-backup',
  autoBackup: false,
  autoBackupInterval: 24,
}

type StoredWebDAVConfig = typeof DEFAULT_CONFIG

async function readStoredWebDAVConfig(): Promise<StoredWebDAVConfig> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const backup = (settings['backup'] || {}) as Record<string, unknown>
  const webdav = backup['webdav']

  if (webdav && typeof webdav === 'object' && !Array.isArray(webdav)) {
    return { ...DEFAULT_CONFIG, ...(webdav as Partial<StoredWebDAVConfig>) }
  }

  if (fs.existsSync(LEGACY_WEBDAV_CONFIG_FILE)) {
    try {
      const content = await fs.promises.readFile(LEGACY_WEBDAV_CONFIG_FILE, 'utf-8')
      const legacy = { ...DEFAULT_CONFIG, ...JSON.parse(content) } as StoredWebDAVConfig
      await updateConfigSection(['settings', 'backup', 'webdav'], legacy)
      return legacy
    } catch {
      // ignore
    }
  }

  return DEFAULT_CONFIG
}

export async function GET() {
  try {
    const config = await readStoredWebDAVConfig()

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { server, username, password, remotePath, autoBackup, autoBackupInterval } = body

    if (!server) {
      return NextResponse.json({ error: '服务器地址为必填项' }, { status: 400 })
    }

    const existingConfig = await readStoredWebDAVConfig()

    const newConfig: StoredWebDAVConfig = {
      server: server || existingConfig.server,
      username: username || existingConfig.username,
      password: password === '********' ? existingConfig.password : password || '',
      remotePath: remotePath || existingConfig.remotePath,
      autoBackup: autoBackup !== undefined ? autoBackup : existingConfig.autoBackup,
      autoBackupInterval: autoBackupInterval || existingConfig.autoBackupInterval,
    }

    await updateConfigSection(['settings', 'backup', 'webdav'], newConfig)

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
