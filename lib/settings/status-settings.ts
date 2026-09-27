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

  for (const key of STATUS_COLOR_KEYS) {
    const value = input[key]
    if (typeof value === 'string' && value.trim()) {
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
let inflight: Promise<StatusColorSettings> | null = null

// 读取游戏状态颜色设置（带模块级缓存，避免每个卡片都请求一次）
export async function readStatusColorSettings(): Promise<StatusColorSettings> {
  if (cache) {
    return cache
  }

  if (!inflight) {
    inflight = api
      .get<{ data: StatusColorSettings }>('/settings/appearance/status')
      .then((response) => {
        cache = normalizeStatusColorSettings(response.data.data)
        return cache
      })
      .catch(() => {
        cache = { ...DEFAULT_STATUS_COLOR_SETTINGS }
        return cache
      })
      .finally(() => {
        inflight = null
      })
  }

  return inflight
}

export async function writeStatusColorSettings(settings: StatusColorSettings): Promise<void> {
  const normalized = normalizeStatusColorSettings(settings)
  await api.post('/settings/appearance/status', normalized)
  cache = normalized
}

export function notifyStatusColorSettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(STATUS_SETTINGS_EVENT))
}
