import fs from 'node:fs'
import path from 'node:path'

import { normalizeBackupContentOptions } from '@/lib/backup-content'

import type { BackupContentOptions } from '@/types'

export const DATA_SETTINGS_DIR = path.join(process.cwd(), 'data', 'settings')
export const APPEARANCE_SETTINGS_FILE = path.join(DATA_SETTINGS_DIR, 'appearance.json')
export const BACKUP_SETTINGS_FILE = path.join(DATA_SETTINGS_DIR, 'backup.json')
export const GENERAL_SETTINGS_FILE = path.join(DATA_SETTINGS_DIR, 'general.json')
export const PLATFORM_SETTINGS_FILE = path.join(DATA_SETTINGS_DIR, 'platform.json')

const LEGACY_CONFIG_FILE = path.join(process.cwd(), 'app', 'config.json')

// Promise 队列，确保对配置文件的读写串行执行
let queue: Promise<void> = Promise.resolve()
let migratedLegacy = false

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const task = queue.then(fn, fn)
  queue = task.then(() => {})
  return task
}

async function readJsonObject(filePath: string): Promise<Record<string, unknown>> {
  try {
    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    }
  } catch {
    // ignore
  }
  return {}
}

async function writeJsonObject(
  filePath: string,
  data: Record<string, unknown>,
  createOnly = false,
): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), {
      encoding: 'utf-8',
      flag: createOnly ? 'wx' : 'w',
    })
  } catch (error) {
    if (!createOnly || !(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST')
      throw error
  }
}

function setNestedValue(target: Record<string, unknown>, keys: string[], value: unknown): void {
  if (keys.length === 0) return
  let current: Record<string, unknown> = target
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!
    if (typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[keys[keys.length - 1]!] = value
}

/** 首次读取或写入前，自动将旧版 app/config.json 拆分迁移到 data/settings/ */
async function ensureLegacyConfigMigrated(): Promise<void> {
  if (migratedLegacy) return
  migratedLegacy = true

  if (!fs.existsSync(LEGACY_CONFIG_FILE)) return
  const hasNewFiles =
    fs.existsSync(APPEARANCE_SETTINGS_FILE) ||
    fs.existsSync(BACKUP_SETTINGS_FILE) ||
    fs.existsSync(GENERAL_SETTINGS_FILE)
  if (hasNewFiles) return

  const legacy = await readJsonObject(LEGACY_CONFIG_FILE)
  const settings = (legacy['settings'] ?? {}) as Record<string, unknown>
  const { appearance, backup, ...rest } = settings

  if (appearance && typeof appearance === 'object' && !Array.isArray(appearance)) {
    await writeJsonObject(APPEARANCE_SETTINGS_FILE, appearance as Record<string, unknown>, true)
  }
  if (backup && typeof backup === 'object' && !Array.isArray(backup)) {
    await writeJsonObject(BACKUP_SETTINGS_FILE, backup as Record<string, unknown>, true)
  }
  if (Object.keys(rest).length > 0) {
    await writeJsonObject(GENERAL_SETTINGS_FILE, rest, true)
  }
}

/** 读取聚合后的配置视图（兼容原有 { settings: { appearance, backup, ... } } 结构） */
export async function readConfig(): Promise<Record<string, unknown>> {
  return enqueue(async () => {
    await ensureLegacyConfigMigrated()
    const [appearance, backup, general] = await Promise.all([
      readJsonObject(APPEARANCE_SETTINGS_FILE),
      readJsonObject(BACKUP_SETTINGS_FILE),
      readJsonObject(GENERAL_SETTINGS_FILE),
    ])

    return {
      settings: {
        ...general,
        appearance,
        backup,
      },
    }
  })
}

/** 写入完整配置，按领域分别落盘到 data/settings/{appearance,backup,general}.json */
export async function writeConfig(config: Record<string, unknown>): Promise<void> {
  return enqueue(async () => {
    await ensureLegacyConfigMigrated()
    const settings = (config['settings'] ?? {}) as Record<string, unknown>
    const { appearance, backup, ...rest } = settings

    if (appearance && typeof appearance === 'object' && !Array.isArray(appearance)) {
      await writeJsonObject(APPEARANCE_SETTINGS_FILE, appearance as Record<string, unknown>)
    }
    if (backup && typeof backup === 'object' && !Array.isArray(backup)) {
      await writeJsonObject(BACKUP_SETTINGS_FILE, backup as Record<string, unknown>)
    }
    await writeJsonObject(GENERAL_SETTINGS_FILE, rest)
  })
}

/**
 * 原子更新某个配置子路径，自动路由到对应的 data/settings/*.json 文件。
 * - ['settings', 'appearance', ...] -> data/settings/appearance.json
 * - ['settings', 'backup', ...]     -> data/settings/backup.json
 * - ['settings', ...]               -> data/settings/general.json
 */
export async function updateConfigSection(keys: string[], value: unknown): Promise<void> {
  return enqueue(async () => {
    await ensureLegacyConfigMigrated()

    if (keys[0] === 'settings' && keys[1] === 'appearance') {
      const target = await readJsonObject(APPEARANCE_SETTINGS_FILE)
      const subKeys = keys.slice(2)
      if (subKeys.length === 0 && value && typeof value === 'object' && !Array.isArray(value)) {
        await writeJsonObject(APPEARANCE_SETTINGS_FILE, value as Record<string, unknown>)
      } else {
        setNestedValue(target, subKeys, value)
        await writeJsonObject(APPEARANCE_SETTINGS_FILE, target)
      }
      return
    }

    if (keys[0] === 'settings' && keys[1] === 'backup') {
      const target = await readJsonObject(BACKUP_SETTINGS_FILE)
      const subKeys = keys.slice(2)
      if (subKeys.length === 0 && value && typeof value === 'object' && !Array.isArray(value)) {
        await writeJsonObject(BACKUP_SETTINGS_FILE, value as Record<string, unknown>)
      } else {
        setNestedValue(target, subKeys, value)
        await writeJsonObject(BACKUP_SETTINGS_FILE, target)
      }
      return
    }

    const target = await readJsonObject(GENERAL_SETTINGS_FILE)
    const subKeys = keys[0] === 'settings' ? keys.slice(1) : keys
    setNestedValue(target, subKeys, value)
    await writeJsonObject(GENERAL_SETTINGS_FILE, target)
  })
}

/** 读取游戏存档备份配置（data/settings/backup.json） */
export async function readGameSaveBackupConfig(): Promise<{
  enabled: boolean
  directory: string
}> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const backup = (settings['backup'] || {}) as Record<string, unknown>
  const save = (backup['save'] || {}) as Record<string, unknown>
  return {
    enabled: Boolean(save.active),
    directory: typeof save.dir === 'string' ? save.dir : '',
  }
}

/** 读取备份内容可选项配置（data/settings/backup.json） */
export async function readBackupContentConfig(): Promise<BackupContentOptions> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const backup = (settings['backup'] || {}) as Record<string, unknown>
  return normalizeBackupContentOptions(backup['content'])
}

/** 写入备份内容可选项配置（data/settings/backup.json） */
export async function writeBackupContentConfig(options: BackupContentOptions): Promise<void> {
  const normalized = normalizeBackupContentOptions(options)
  await updateConfigSection(['settings', 'backup', 'content'], normalized)
}
