import { readConfig, updateConfigSection } from '@/lib/server/config-rw'

const SYNC_KEY = 'sync'
const LEGACY_SYNC_KEY = 'webdav'

/**
 * 读取同步服务器的原始存储节点。
 * 优先读新键 `sync`，若不存在则回退旧键 `webdav`，保证历史配置不丢失。
 */
export async function readSyncStoreNode(): Promise<Record<string, unknown>> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const backup = (settings['backup'] || {}) as Record<string, unknown>

  const current = backup[SYNC_KEY]
  if (current && typeof current === 'object' && !Array.isArray(current)) {
    return current as Record<string, unknown>
  }

  const legacy = backup[LEGACY_SYNC_KEY]
  if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
    return legacy as Record<string, unknown>
  }

  return {}
}

/** 写入同步服务器存储节点（统一落到新键 `sync`） */
export async function writeSyncStoreNode(value: Record<string, unknown>): Promise<void> {
  await updateConfigSection(['settings', 'backup', SYNC_KEY], value)
}
