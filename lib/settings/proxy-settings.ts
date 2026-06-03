export type ProxyType = 'http' | 'https' | 'socks5'

export type ProxySettings = {
  enabled: boolean
  type: ProxyType
  host: string
  port: number
  username: string
  password: string
}

export const PROXY_SETTINGS_STORAGE_KEY = 'vnweb:proxy-settings'
export const PROXY_SETTINGS_EVENT = 'vnweb:proxy-settings-changed'

export const DEFAULT_PROXY_SETTINGS: ProxySettings = {
  enabled: false,
  type: 'http',
  host: '',
  port: 7890,
  username: '',
  password: '',
}

export function normalizeProxySettings(
  input: Partial<ProxySettings> | ProxySettings,
): ProxySettings {
  return {
    enabled: Boolean(input.enabled),
    type:
      input.type === 'http' || input.type === 'https' || input.type === 'socks5'
        ? input.type
        : 'http',
    host: typeof input.host === 'string' ? input.host.trim() : '',
    port:
      typeof input.port === 'number' && input.port > 0 && input.port <= 65535
        ? input.port
        : 7890,
    username: typeof input.username === 'string' ? input.username.trim() : '',
    password: typeof input.password === 'string' ? input.password.trim() : '',
  }
}

export function readProxySettings(): ProxySettings {
  if (typeof window === 'undefined') {
    return DEFAULT_PROXY_SETTINGS
  }

  const raw = window.localStorage.getItem(PROXY_SETTINGS_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_PROXY_SETTINGS
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProxySettings>
    return normalizeProxySettings(parsed)
  } catch {
    return DEFAULT_PROXY_SETTINGS
  }
}

export function writeProxySettings(settings: ProxySettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    PROXY_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeProxySettings(settings)),
  )
}

export function notifyProxySettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(PROXY_SETTINGS_EVENT))
}

export function buildProxyUrl(settings: ProxySettings): string | null {
  if (!settings.enabled || !settings.host) {
    return null
  }

  const auth =
    settings.username && settings.password
      ? `${encodeURIComponent(settings.username)}:${encodeURIComponent(
          settings.password,
        )}@`
      : ''

  return `${settings.type}://${auth}${settings.host}:${settings.port}`
}

/**
 * 获取当前启用的代理配置（从数据库）
 * 仅在服务器端使用
 */
export async function getEnabledProxySettings(): Promise<ProxySettings | null> {
  try {
    const { db } = await import('@/lib/drizzle')
    const { ProxyConfigTable } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const result = await db
      .select()
      .from(ProxyConfigTable)
      .where(eq(ProxyConfigTable.enabled, 1))
      .limit(1)

    if (result.length === 0 || !result[0]) {
      return null
    }

    const row = result[0]
    return {
      enabled: true,
      type: row.type as ProxyType,
      host: row.host,
      port: row.port,
      username: row.username || '',
      password: row.password || '',
    }
  } catch (error) {
    console.error('Failed to get enabled proxy settings:', error)
    return null
  }
}
