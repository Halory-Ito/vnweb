export type ProviderSettings = {
  /** 已禁用的提供商 ID 集合 */
  disabledProviders: string[]
}

export const PROVIDER_SETTINGS_STORAGE_KEY = 'vnweb:provider-settings'
export const PROVIDER_SETTINGS_EVENT = 'vnweb:provider-settings-changed'

export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  disabledProviders: [],
}

export function normalizeProviderSettings(
  input: Partial<ProviderSettings> | ProviderSettings,
): ProviderSettings {
  const disabled = Array.isArray(input.disabledProviders)
    ? input.disabledProviders.filter(
        (item): item is string => typeof item === 'string',
      )
    : []

  return {
    disabledProviders: disabled,
  }
}

export function readProviderSettings(): ProviderSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_PROVIDER_SETTINGS
  }

  const raw = window.localStorage.getItem(PROVIDER_SETTINGS_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_PROVIDER_SETTINGS
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProviderSettings>
    return normalizeProviderSettings(parsed)
  } catch {
    return DEFAULT_PROVIDER_SETTINGS
  }
}

export function writeProviderSettings(settings: ProviderSettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    PROVIDER_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeProviderSettings(settings)),
  )
}

export function isProviderEnabled(
  providerId: string,
  settings?: ProviderSettings,
): boolean {
  const s = settings ?? readProviderSettings()
  return !s.disabledProviders.includes(providerId)
}

export function setProviderEnabled(providerId: string, enabled: boolean) {
  const settings = readProviderSettings()

  if (enabled) {
    settings.disabledProviders = settings.disabledProviders.filter(
      (id) => id !== providerId,
    )
  } else if (!settings.disabledProviders.includes(providerId)) {
    settings.disabledProviders.push(providerId)
  }

  writeProviderSettings(settings)
  notifyProviderSettingsChanged()
}

export function notifyProviderSettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(PROVIDER_SETTINGS_EVENT))
}
