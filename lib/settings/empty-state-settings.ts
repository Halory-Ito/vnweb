import { isAppearanceImageSource } from './appearance-image'
import { api } from '@/lib/request-utils'

export type EmptyStateMode = 'kaomoji' | 'image'

export type EmptyStateSettings = {
  mode: EmptyStateMode
  kaomoji: string[]
  images: string[]
}

export const EMPTY_STATE_KEY = 'vnweb:empty-state-settings'
export const EMPTY_STATE_EVENT = 'vnweb:empty-state-settings-changed'
export const EMPTY_STATE_MAX_ITEMS = 20
export const DEFAULT_EMPTY_STATE: EmptyStateSettings = {
  mode: 'kaomoji',
  kaomoji: ['(｡•́︿•̀｡)', '(´・ω・`)', '(・ω・)ノ'],
  images: [],
}

export function normalizeEmptyStateSettings(
  input: Partial<EmptyStateSettings> | Record<string, unknown> | null | undefined,
): EmptyStateSettings {
  if (!input || typeof input !== 'object') {
    return DEFAULT_EMPTY_STATE
  }

  const settings = input as Partial<EmptyStateSettings>
  const getList = (values: unknown, valid: (value: string) => boolean) =>
    Array.isArray(values)
      ? [
          ...new Set(
            values.filter((value): value is string => typeof value === 'string' && valid(value)),
          ),
        ].slice(0, EMPTY_STATE_MAX_ITEMS)
      : []

  return {
    mode: settings.mode === 'image' ? 'image' : 'kaomoji',
    kaomoji: Array.isArray(settings.kaomoji)
      ? getList(settings.kaomoji, (value) => Boolean(value.trim()) && value.length <= 64)
      : DEFAULT_EMPTY_STATE.kaomoji,
    images: getList(settings.images, isAppearanceImageSource),
  }
}

export function readEmptyStateSnapshot() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(EMPTY_STATE_KEY)
  } catch {
    return null
  }
}

export function parseEmptyStateSettings(raw: string | null): EmptyStateSettings {
  if (!raw) return DEFAULT_EMPTY_STATE
  try {
    const settings = JSON.parse(raw) as Partial<EmptyStateSettings> | null
    return normalizeEmptyStateSettings(settings)
  } catch {
    return DEFAULT_EMPTY_STATE
  }
}

export type EmptyStateConfigResponse = {
  data: EmptyStateSettings
  persisted: boolean
}

export async function getEmptyStateConfigApi(): Promise<EmptyStateConfigResponse> {
  const response = await api.request<EmptyStateConfigResponse>({
    method: 'GET',
    url: '/settings/appearance/empty-state',
  })
  return response.data
}

export async function updateEmptyStateConfigApi(
  settings: EmptyStateSettings,
): Promise<EmptyStateConfigResponse> {
  const response = await api.request<EmptyStateConfigResponse>({
    method: 'POST',
    url: '/settings/appearance/empty-state',
    data: normalizeEmptyStateSettings(settings),
  })
  return response.data
}

export function writeEmptyStateSettings(next: EmptyStateSettings) {
  if (typeof window === 'undefined') return
  const normalized = normalizeEmptyStateSettings(next)
  const serialized = JSON.stringify(normalized)
  window.localStorage.setItem(EMPTY_STATE_KEY, serialized)
  window.dispatchEvent(new Event(EMPTY_STATE_EVENT))
}

export function updateEmptyStateSettings(
  update: (current: EmptyStateSettings) => EmptyStateSettings,
) {
  const next = normalizeEmptyStateSettings(
    update(parseEmptyStateSettings(readEmptyStateSnapshot())),
  )
  const serialized = JSON.stringify(next)
  if (serialized.length > 1_800_000) throw new Error('图片占用空间过大，请先移除部分图片。')
  window.localStorage.setItem(EMPTY_STATE_KEY, serialized)
  window.dispatchEvent(new Event(EMPTY_STATE_EVENT))
  void updateEmptyStateConfigApi(next).catch((error) => {
    console.error('Sync empty state settings failed:', error)
  })
}
