export type GlassSettings = {
  blur: number
  opacity: number
}

export const GLASS_SETTINGS_STORAGE_KEY = 'vnweb:glass-settings'
export const GLASS_SETTINGS_EVENT = 'vnweb:glass-settings-changed'

export const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  blur: 24,
  opacity: 24,
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export function normalizeGlassSettings(
  input: Partial<GlassSettings> | GlassSettings,
): GlassSettings {
  const blur = Number(input.blur ?? DEFAULT_GLASS_SETTINGS.blur)
  const opacity = Number(input.opacity ?? DEFAULT_GLASS_SETTINGS.opacity)

  return {
    blur: clamp(Number.isFinite(blur) ? Math.round(blur) : 0, 0, 150),
    opacity: clamp(Number.isFinite(opacity) ? Math.round(opacity) : 0, 0, 100),
  }
}

export function readGlassSettings(): GlassSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_GLASS_SETTINGS
  }

  const raw = window.localStorage.getItem(GLASS_SETTINGS_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_GLASS_SETTINGS
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GlassSettings>
    return normalizeGlassSettings(parsed)
  } catch {
    return DEFAULT_GLASS_SETTINGS
  }
}

export function writeGlassSettings(settings: GlassSettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    GLASS_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeGlassSettings(settings)),
  )
}

export function applyGlassSettingsToDocument(settings: GlassSettings) {
  if (typeof document === 'undefined') {
    return
  }

  const normalized = normalizeGlassSettings(settings)
  const root = document.documentElement

  root.style.setProperty('--app-glass-blur', `${normalized.blur}px`)
  root.style.setProperty('--app-glass-opacity', `${normalized.opacity / 100}`)
}

export function notifyGlassSettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(GLASS_SETTINGS_EVENT))
}
