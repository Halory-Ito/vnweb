import { readSyncStoreNode } from '@/lib/server/sync-config-store'
import { S3SyncClient } from '@/lib/sync-client/s3-client'
import { WebDAVSyncClient } from '@/lib/sync-client/webdav-adapter'

import type { SyncClient, SyncConnectionConfig } from '@/lib/sync-client/types'
import type { SyncServerConfig } from '@/types'

const DEFAULT_REMOTE_PATH = '/vnweb-backup'

/** 将存储的配置转换为协议层连接配置 */
export function toConnectionConfig(config: SyncServerConfig): SyncConnectionConfig {
  return {
    provider: config.provider || 'webdav',
    remotePath: config.remotePath || DEFAULT_REMOTE_PATH,
    server: config.server,
    username: config.username,
    password: config.password,
    endpoint: config.endpoint,
    bucket: config.bucket,
    region: config.region,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    forcePathStyle: config.forcePathStyle,
  }
}

/** 按 provider 创建同步客户端 */
export function createSyncClient(config: SyncConnectionConfig): SyncClient {
  if (config.provider === 's3') {
    return new S3SyncClient(config)
  }
  return new WebDAVSyncClient(config)
}

/** 读取当前启用的同步配置（兼容旧结构：无 provider 时视为 webdav） */
export async function getEnabledSyncConfig(): Promise<SyncConnectionConfig | null> {
  try {
    const node = await readSyncStoreNode()
    const configs = Array.isArray(node.configs) ? (node.configs as SyncServerConfig[]) : []
    const enabled = configs.find((item) => item && item.enabled === true)
    if (!enabled) {
      // 兼容旧单配置结构（直接是 server/password 字段）
      if (typeof node.server === 'string' && node.server) {
        return toConnectionConfig(node as unknown as SyncServerConfig)
      }
      return null
    }
    return toConnectionConfig(enabled)
  } catch (error) {
    console.error('Get enabled sync config failed:', error)
    return null
  }
}

/** 创建作用于当前启用配置的客户端 */
export async function getEnabledSyncClient(): Promise<SyncClient | null> {
  const config = await getEnabledSyncConfig()
  return config ? createSyncClient(config) : null
}

export type { SyncClient, SyncConnectionConfig, RemoteBackupInfo } from '@/lib/sync-client/types'
export { S3SyncClient } from '@/lib/sync-client/s3-client'
export { WebDAVSyncClient } from '@/lib/sync-client/webdav-adapter'
