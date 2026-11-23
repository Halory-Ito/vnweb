import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { readSyncStoreNode, writeSyncStoreNode } from '@/lib/server/sync-config-store'
import { resolveEnabledWebDAVConfig } from '@/lib/webdav-utils'

import type { SyncConfigStore, SyncProvider, SyncServerConfig } from '@/types'

const LEGACY_WEBDAV_CONFIG_FILE = path.join(process.cwd(), 'app', 'webdav-config.json')

const DEFAULT_STORE: SyncConfigStore = {
  configs: [],
  autoBackup: false,
  autoBackupInterval: 24,
}

const PASSWORD_MASK = '********'

function maskConfig(config: SyncServerConfig): SyncServerConfig {
  return {
    ...config,
    password: config.password ? PASSWORD_MASK : '',
    secretAccessKey: config.secretAccessKey ? PASSWORD_MASK : '',
  }
}

function normalizeProvider(value: unknown): SyncProvider {
  return value === 's3' ? 's3' : 'webdav'
}

async function readStore(): Promise<SyncConfigStore> {
  const syncNode = await readSyncStoreNode()

  // 新版结构：含 configs 数组
  if (Array.isArray(syncNode.configs)) {
    return {
      configs: (syncNode.configs as SyncServerConfig[]).map((item) => ({
        ...item,
        provider: normalizeProvider(item.provider),
      })),
      autoBackup: Boolean(syncNode.autoBackup),
      autoBackupInterval: Number(syncNode.autoBackupInterval) || 24,
    }
  }

  // 旧版结构或旧文件：迁移为第一条配置
  const legacy = resolveEnabledWebDAVConfig(syncNode)
  let migrated: Partial<SyncServerConfig> = legacy || {}

  if (!migrated.server && fs.existsSync(LEGACY_WEBDAV_CONFIG_FILE)) {
    try {
      const content = await fs.promises.readFile(LEGACY_WEBDAV_CONFIG_FILE, 'utf-8')
      migrated = JSON.parse(content) as Partial<SyncServerConfig>
    } catch {
      // ignore
    }
  }

  if (migrated.server) {
    const config: SyncServerConfig = {
      id: randomUUID(),
      name: '默认服务器',
      provider: 'webdav',
      server: migrated.server || '',
      username: migrated.username || '',
      password: migrated.password || '',
      remotePath: migrated.remotePath || '/vnweb-backup',
      enabled: true,
    }
    const store: SyncConfigStore = { ...DEFAULT_STORE, configs: [config] }
    await writeStore(store)
    return store
  }

  return DEFAULT_STORE
}

async function writeStore(store: SyncConfigStore): Promise<void> {
  await writeSyncStoreNode(store as unknown as Record<string, unknown>)
}

function parseBody(body: Record<string, unknown>) {
  const str = (key: string) => (typeof body[key] === 'string' ? (body[key] as string).trim() : '')
  const password = (key: string) => (typeof body[key] === 'string' ? (body[key] as string) : '')
  return {
    id: str('id') || undefined,
    name: str('name'),
    provider: normalizeProvider(body.provider),
    server: str('server'),
    username: str('username'),
    password: password('password'),
    remotePath: str('remotePath') || '/vnweb-backup',
    endpoint: str('endpoint'),
    bucket: str('bucket'),
    region: str('region'),
    accessKeyId: str('accessKeyId'),
    secretAccessKey: password('secretAccessKey'),
    forcePathStyle: body.forcePathStyle === true,
    enabled: body.enabled === true,
  }
}

function validateInput(input: ReturnType<typeof parseBody>): string | null {
  if (!input.name) return '名称为必填项'
  if (input.provider === 's3') {
    if (!input.endpoint) return 'S3 服务地址为必填项'
    if (!input.bucket) return '存储桶名称为必填项'
    if (!input.accessKeyId) return 'Access Key ID 为必填项'
    if (!input.secretAccessKey && input.secretAccessKey !== PASSWORD_MASK) {
      return 'Secret Access Key 为必填项'
    }
  } else if (!input.server) {
    return '服务器地址为必填项'
  }
  return null
}

/** 合并输入到已有配置，密码掩码时保留原值 */
function applyInput(
  existing: SyncServerConfig | null,
  input: ReturnType<typeof parseBody>,
  id: string,
): SyncServerConfig {
  return {
    id,
    name: input.name || existing?.name || '',
    provider: input.provider,
    enabled: input.enabled,
    remotePath: input.remotePath || existing?.remotePath || '/vnweb-backup',
    server: input.provider === 'webdav' ? input.server || existing?.server || '' : '',
    username: input.provider === 'webdav' ? input.username || existing?.username || '' : '',
    password:
      input.provider === 'webdav'
        ? input.password === PASSWORD_MASK
          ? existing?.password || ''
          : input.password || ''
        : '',
    endpoint: input.provider === 's3' ? input.endpoint || existing?.endpoint || '' : '',
    bucket: input.provider === 's3' ? input.bucket || existing?.bucket || '' : '',
    region: input.provider === 's3' ? input.region || existing?.region || '' : '',
    accessKeyId: input.provider === 's3' ? input.accessKeyId || existing?.accessKeyId || '' : '',
    secretAccessKey:
      input.provider === 's3'
        ? input.secretAccessKey === PASSWORD_MASK
          ? existing?.secretAccessKey || ''
          : input.secretAccessKey || ''
        : '',
    forcePathStyle: input.provider === 's3' ? input.forcePathStyle : false,
  }
}

function withEnabledExclusive(configs: SyncServerConfig[], targetId: string, enabled: boolean) {
  return configs.map((item) =>
    item.id === targetId ? { ...item, enabled } : enabled ? { ...item, enabled: false } : item,
  )
}

export async function GET() {
  try {
    const store = await readStore()
    return NextResponse.json({
      data: {
        configs: store.configs.map(maskConfig),
        autoBackup: store.autoBackup,
        autoBackupInterval: store.autoBackupInterval,
      },
    })
  } catch (error) {
    console.error('Get sync config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取同步服务器配置失败' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = parseBody(await req.json())
    const invalid = validateInput(input)
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 })
    }

    const store = await readStore()
    const config = applyInput(null, input, randomUUID())
    config.enabled = input.enabled || store.configs.length === 0
    const configs = withEnabledExclusive([...store.configs, config], config.id, config.enabled)
    await writeStore({ ...store, configs })

    return NextResponse.json({ data: maskConfig(configs.find((item) => item.id === config.id)!) })
  } catch (error) {
    console.error('Create sync config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '创建同步服务器配置失败' },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const input = parseBody(await req.json())
    if (!input.id) {
      return NextResponse.json({ error: '缺少配置 ID' }, { status: 400 })
    }

    const store = await readStore()
    const existing = store.configs.find((item) => item.id === input.id)
    if (!existing) {
      return NextResponse.json({ error: '配置不存在' }, { status: 404 })
    }

    const invalid = validateInput(input)
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 })
    }

    const updated = applyInput(existing, input, input.id)
    let configs = store.configs.map((item) => (item.id === input.id ? updated : item))
    configs = withEnabledExclusive(configs, input.id, input.enabled)
    await writeStore({ ...store, configs })

    return NextResponse.json({ data: maskConfig(configs.find((item) => item.id === input.id)!) })
  } catch (error) {
    console.error('Update sync config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新同步服务器配置失败' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: '缺少配置 ID' }, { status: 400 })
    }

    const store = await readStore()
    const remaining = store.configs.filter((item) => item.id !== id)
    if (remaining.length === store.configs.length) {
      return NextResponse.json({ error: '配置不存在' }, { status: 404 })
    }

    if (store.configs.find((item) => item.id === id)?.enabled && remaining.length > 0) {
      remaining[0] = { ...remaining[0], enabled: true }
    }
    await writeStore({ ...store, configs: remaining })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Delete sync config failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '删除同步服务器配置失败' },
      { status: 500 },
    )
  }
}
