import { api } from '@/lib/request-utils'

export type GuideColorSettings = {
  choice: string
  save: string
  load: string
  note: string
}

export const GUIDE_SETTINGS_EVENT = 'vnweb:guide-settings-changed'

export const DEFAULT_GUIDE_SETTINGS: GuideColorSettings = {
  choice: '#3b82f6',
  save: '#10b981',
  load: '#f59e0b',
  note: '#6b7280',
}

// 从 API 读取 Guide 设置
export async function readGuideSettings(): Promise<GuideColorSettings> {
  try {
    const response = await api.get<{ data: GuideColorSettings }>('/settings/appearance/guide')
    return response.data.data
  } catch {
    return DEFAULT_GUIDE_SETTINGS
  }
}

// 通过 API 写入 Guide 设置
export async function writeGuideSettings(settings: GuideColorSettings): Promise<void> {
  await api.post('/settings/appearance/guide', settings)
}

// 通知 Guide 设置变更
export function notifyGuideSettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(GUIDE_SETTINGS_EVENT))
}
