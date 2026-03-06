export type BackgroundSettings = {
  customBackgroundEnabled: boolean
  customBackgroundImage: string
  lastGameBackgroundImage: string
}

export const BACKGROUND_SETTINGS_STORAGE_KEY = 'vnweb:background-settings'
export const BACKGROUND_SETTINGS_EVENT = 'vnweb:background-settings-changed'

export const DEFAULT_LAST_GAME_BACKGROUND_IMAGE = '/bg.png'

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  customBackgroundEnabled: false,
  customBackgroundImage: '',
  lastGameBackgroundImage: DEFAULT_LAST_GAME_BACKGROUND_IMAGE,
}

export function normalizeBackgroundSettings(
  input: Partial<BackgroundSettings> | BackgroundSettings,
): BackgroundSettings {
  return {
    customBackgroundEnabled: Boolean(input.customBackgroundEnabled),
    customBackgroundImage:
      typeof input.customBackgroundImage === 'string'
        ? input.customBackgroundImage.trim()
        : '',
    lastGameBackgroundImage:
      typeof input.lastGameBackgroundImage === 'string' &&
      input.lastGameBackgroundImage.trim().length > 0
        ? input.lastGameBackgroundImage.trim()
        : DEFAULT_LAST_GAME_BACKGROUND_IMAGE,
  }
}

export function readBackgroundSettings(): BackgroundSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_BACKGROUND_SETTINGS
  }

  const raw = window.localStorage.getItem(BACKGROUND_SETTINGS_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_BACKGROUND_SETTINGS
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BackgroundSettings>
    return normalizeBackgroundSettings(parsed)
  } catch {
    return DEFAULT_BACKGROUND_SETTINGS
  }
}

export function writeBackgroundSettings(settings: BackgroundSettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    BACKGROUND_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeBackgroundSettings(settings)),
  )
}

export function notifyBackgroundSettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(BACKGROUND_SETTINGS_EVENT))
}

export function updateLastGameBackground(image: string) {
  const normalizedImage = image.trim()
  if (!normalizedImage) {
    return
  }

  const current = readBackgroundSettings()
  const next = normalizeBackgroundSettings({
    ...current,
    lastGameBackgroundImage: normalizedImage,
  })
  writeBackgroundSettings(next)
  notifyBackgroundSettingsChanged()
}
