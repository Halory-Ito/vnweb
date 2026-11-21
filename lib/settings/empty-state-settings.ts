export type EmptyStateMode = 'kaomoji' | 'image'

export type EmptyStateSettings = {
  mode: EmptyStateMode
  kaomoji: string[]
  images: string[]
}

export const EMPTY_STATE_KEY = 'vnweb:empty-state-settings'
export const EMPTY_STATE_EVENT = 'vnweb:empty-state-settings-changed'
export const EMPTY_STATE_MAX_ITEMS = 20
export const EMPTY_STATE_MAX_IMAGE_BYTES = 256 * 1024
export const EMPTY_STATE_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
]
export const DEFAULT_EMPTY_STATE: EmptyStateSettings = {
  mode: 'kaomoji',
  kaomoji: ['(｡•́︿•̀｡)', '(´・ω・`)', '(・ω・)ノ'],
  images: [],
}

export function isEmptyStateImageUrl(value: string) {
  if (value.length > 2048 || value.includes('\\')) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
  } catch {
    return false
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
    const getList = (values: unknown, valid: (value: string) => boolean) =>
      Array.isArray(values)
        ? [
            ...new Set(
              values.filter((value): value is string => typeof value === 'string' && valid(value)),
            ),
          ].slice(0, EMPTY_STATE_MAX_ITEMS)
        : []

    return {
      mode: settings?.mode === 'image' ? 'image' : 'kaomoji',
      kaomoji: getList(settings?.kaomoji, (value) => Boolean(value.trim()) && value.length <= 64),
      images: getList(
        settings?.images,
        (value) =>
          isEmptyStateImageUrl(value) ||
          (value.length <= Math.ceil(EMPTY_STATE_MAX_IMAGE_BYTES / 3) * 4 + 32 &&
            /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[a-z\d+/]+={0,2}$/i.test(value)),
      ),
    }
  } catch {
    return DEFAULT_EMPTY_STATE
  }
}

export function updateEmptyStateSettings(
  update: (current: EmptyStateSettings) => EmptyStateSettings,
) {
  const next = update(parseEmptyStateSettings(readEmptyStateSnapshot()))
  const serialized = JSON.stringify(next)
  if (serialized.length > 1_800_000) throw new Error('图片占用空间过大，请先移除部分图片。')
  window.localStorage.setItem(EMPTY_STATE_KEY, serialized)
  window.dispatchEvent(new Event(EMPTY_STATE_EVENT))
}
