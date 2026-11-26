import { api } from '@/lib/request-utils'

// 游戏状态的 6 个取值（与 GamePlayTable.status 一致）
export const STATUS_COLOR_KEYS = ['0', '1', '2', '3', '4', '5'] as const

export type StatusColorSettings = Record<string, string>

export const STATUS_SETTINGS_EVENT = 'vnweb:status-settings-changed'

export const DEFAULT_STATUS_COLOR_SETTINGS: StatusColorSettings = {
  '0': '#a1a1aa', // 未开始
  '1': '#34d399', // 游玩中
  '2': '#fbbf24', // 部分完成
  '3': '#38bdf8', // 已完成
  '4': '#a78bfa', // 多周目
  '5': '#fb7185', // 搁置中
}

export function normalizeStatusColorSettings(
  input: Partial<StatusColorSettings> | null | undefined,
): StatusColorSettings {
  const result: StatusColorSettings = { ...DEFAULT_STATUS_COLOR_SETTINGS }

  if (!input) {
    return result
  }

  for (const [key, value] of Object.entries(input)) {
    if (/^\d+$/.test(key) && typeof value === 'string' && /^#[\da-f]{6}$/i.test(value.trim())) {
      result[key] = value.trim()
    }
  }

  return result
}

export function getStatusColor(settings: StatusColorSettings, status?: number | null): string {
  const key = String(Number(status))
  return settings[key] || DEFAULT_STATUS_COLOR_SETTINGS['0']!
}

let cache: StatusColorSettings | null = null
let loaded = false
let inflight: Promise<StatusColorSettings> | null = null
const listeners = new Set<() => void>()
let windowSubscribed = false

function areStatusColorSettingsEqual(a: StatusColorSettings, b: StatusColorSettings): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) {
    return false
  }
  return keysA.every((key) => Object.is(a[key], b[key]))
}

function emitStatusColorSettingsChange() {
  for (const listener of listeners) {
    listener()
  }
}

function updateStatusColorCache(normalized: StatusColorSettings): StatusColorSettings {
  const prev = cache ?? DEFAULT_STATUS_COLOR_SETTINGS
  loaded = true
  if (areStatusColorSettingsEqual(prev, normalized)) {
    cache = prev
    return prev
  }

  cache = normalized
  emitStatusColorSettingsChange()
  return normalized
}

export function getDefaultStatusColorSettings(): StatusColorSettings {
  return DEFAULT_STATUS_COLOR_SETTINGS
}

export function getCachedStatusColorSettings(): StatusColorSettings {
  return cache ?? DEFAULT_STATUS_COLOR_SETTINGS
}

export function subscribeStatusColorSettings(listener: () => void): () => void {
  if (listeners.size === 0 && typeof window !== 'undefined' && !windowSubscribed) {
    window.addEventListener(STATUS_SETTINGS_EVENT, emitStatusColorSettingsChange)
    windowSubscribed = true
  }
  listeners.add(listener)

  if (!loaded && typeof window !== 'undefined') {
    void readStatusColorSettings()
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && typeof window !== 'undefined' && windowSubscribed) {
      window.removeEventListener(STATUS_SETTINGS_EVENT, emitStatusColorSettingsChange)
      windowSubscribed = false
    }
  }
}

// 读取游戏状态颜色设置（带模块级缓存，避免每个卡片都请求一次）
export async function readStatusColorSettings(): Promise<StatusColorSettings> {
  if (loaded && cache) {
    return cache
  }

  if (!inflight) {
    inflight = api
      .get<{ data: StatusColorSettings }>('/settings/appearance/status')
      .then((response) => updateStatusColorCache(normalizeStatusColorSettings(response.data.data)))
      .catch(() => updateStatusColorCache({ ...DEFAULT_STATUS_COLOR_SETTINGS }))
      .finally(() => {
        inflight = null
      })
  }

  return inflight
}

export async function writeStatusColorSettings(settings: StatusColorSettings): Promise<void> {
  const response = await api.post<{ data: StatusColorSettings }>(
    '/settings/appearance/status',
    settings,
  )
  updateStatusColorCache(normalizeStatusColorSettings(response.data.data))
}

export function notifyStatusColorSettingsChanged() {
  if (typeof window === 'undefined') {
    emitStatusColorSettingsChange()
    return
  }

  window.dispatchEvent(new Event(STATUS_SETTINGS_EVENT))
}
