const prefix = 'vnweb.platform-settings.v1.'
type CacheKey = 'config' | 'visibility' | 'status-mappings' | 'accounts'

export function writePlatformCache(key: CacheKey, value: object | null) {
  try {
    if (value === null) window.localStorage.removeItem(prefix + key)
    else window.localStorage.setItem(prefix + key, JSON.stringify(value))
  } catch {
    // Server persistence still works when browser storage is unavailable.
  }
}

export async function readPlatformCache<T extends object>(key: CacheKey, load: () => Promise<T>) {
  try {
    const raw = window.localStorage.getItem(prefix + key)
    const value: unknown = raw === null ? null : JSON.parse(raw)
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as T
  } catch {
    // Missing or unreadable cache entries fall back to the server.
  }

  const value = await load()
  writePlatformCache(key, value)
  return value
}
