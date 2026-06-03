export type PluginSettings = {
  disabledPlugins: string[]
}

export const PLUGIN_SETTINGS_STORAGE_KEY = 'vnweb:plugin-settings'
export const PLUGIN_SETTINGS_EVENT = 'vnweb:plugin-settings-changed'

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
  disabledPlugins: [],
}

export function normalizePluginSettings(
  input: Partial<PluginSettings> | PluginSettings,
): PluginSettings {
  const disabled = Array.isArray(input.disabledPlugins)
    ? input.disabledPlugins.filter(
        (item): item is string => typeof item === 'string',
      )
    : []
  return { disabledPlugins: disabled }
}

export function readPluginSettings(): PluginSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_PLUGIN_SETTINGS
  }
  const raw = window.localStorage.getItem(PLUGIN_SETTINGS_STORAGE_KEY)
  if (!raw) return DEFAULT_PLUGIN_SETTINGS
  try {
    const parsed = JSON.parse(raw) as Partial<PluginSettings>
    return normalizePluginSettings(parsed)
  } catch {
    return DEFAULT_PLUGIN_SETTINGS
  }
}

export function writePluginSettings(settings: PluginSettings) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    PLUGIN_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizePluginSettings(settings)),
  )
}

export function isPluginEnabled(
  pluginId: string,
  settings?: PluginSettings,
): boolean {
  const s = settings ?? readPluginSettings()
  return !s.disabledPlugins.includes(pluginId)
}

export function setPluginEnabled(pluginId: string, enabled: boolean) {
  const settings = readPluginSettings()
  if (enabled) {
    settings.disabledPlugins = settings.disabledPlugins.filter(
      (id) => id !== pluginId,
    )
  } else if (!settings.disabledPlugins.includes(pluginId)) {
    settings.disabledPlugins.push(pluginId)
  }
  writePluginSettings(settings)
  notifyPluginSettingsChanged()
}

export function notifyPluginSettingsChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PLUGIN_SETTINGS_EVENT))
}
