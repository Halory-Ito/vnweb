import { api } from '@/lib/request-utils'

export type ChartSettings = {
  color: string
  opacity: number
}

export const CHART_SETTINGS_EVENT = 'vnweb:chart-settings-changed'

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  color: '#4f46e5',
  opacity: 100,
}

// 从 API 读取图表设置
export async function readChartSettings(): Promise<ChartSettings> {
  try {
    const response = await api.get<{ data: ChartSettings }>(
      '/settings/appearance/chart',
    )
    return response.data.data
  } catch {
    return DEFAULT_CHART_SETTINGS
  }
}

// 通过 API 写入图表设置
export async function writeChartSettings(
  settings: ChartSettings,
): Promise<void> {
  await api.post('/settings/appearance/chart', settings)
}

// 通知图表设置变更
export function notifyChartSettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(CHART_SETTINGS_EVENT))
}
