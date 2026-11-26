import { api } from '@/lib/request-utils'

export const DEFAULT_APP_NAME = 'vnweb'
export const DEFAULT_APP_ICON_URL = '/LOGO.png'
export const DEFAULT_FAVICON_URL = '/icon.png'
export const DEFAULT_APP_PORT = 8999
export const MIN_APP_PORT = 1024
export const MAX_APP_PORT = 65535
export const APP_NAME_MAX_LENGTH = 60
export const APP_SETTINGS_STORAGE_KEY = 'vnweb:app-settings'
export const APP_SETTINGS_EVENT = 'vnweb:app-settings-changed'

export const ALLOWED_APP_ICON_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.ico',
  '.avif',
  '.bmp',
] as const

export type AppSettings = {
  name: string
  iconPath: string
  desktopIconPath: string
  port: number
}

export type AppSettingsPatch = Partial<AppSettings>

export type AppSettingsResponse = {
  data: AppSettings
  runtimePort: number | null
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  name: DEFAULT_APP_NAME,
  iconPath: '',
  desktopIconPath: '',
  port: DEFAULT_APP_PORT,
}

const APP_ICON_PREFIX = '/assets/app/'

function extractCleanIconFileName(value: string): string | null {
  const clean = value.split(/[?#]/)[0]?.trim() ?? ''
  if (!clean.startsWith(APP_ICON_PREFIX)) return null
  const fileName = clean.slice(APP_ICON_PREFIX.length)
  if (
    !fileName ||
    fileName === '.' ||
    fileName === '..' ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName.includes('..') ||
    fileName.includes('%') ||
    fileName.includes('\0')
  ) {
    return null
  }
  return fileName
}

function getLowerExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : ''
}

export function isSafeAppIconPath(value: string): boolean {
  const fileName = extractCleanIconFileName(value)
  if (!fileName) return false
  const ext = getLowerExtension(fileName)
  return (ALLOWED_APP_ICON_EXTENSIONS as readonly string[]).includes(ext)
}

export function isSafeDesktopIconPath(value: string): boolean {
  const fileName = extractCleanIconFileName(value)
  if (!fileName) return false
  return getLowerExtension(fileName) === '.png'
}

export function extractAppIconFileName(value: string): string | null {
  if (!isSafeAppIconPath(value)) return null
  return extractCleanIconFileName(value)
}

export function hasControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) {
      return true
    }
  }
  return false
}

export function normalizeAppName(value: unknown): string {
  if (typeof value !== 'string' || hasControlCharacters(value)) {
    return DEFAULT_APP_NAME
  }
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_APP_NAME
  return trimmed.slice(0, APP_NAME_MAX_LENGTH)
}

export function isValidAppPort(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_APP_PORT &&
    value <= MAX_APP_PORT
  )
}

export function normalizeAppSettings(input: unknown): AppSettings {
  const source =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {}

  const rawIcon = typeof source.iconPath === 'string' ? source.iconPath.trim() : ''
  const iconPath = rawIcon && isSafeAppIconPath(rawIcon) ? rawIcon : ''
  const rawDesktopIcon =
    typeof source.desktopIconPath === 'string' ? source.desktopIconPath.trim() : ''
  const desktopIconPath =
    iconPath && rawDesktopIcon && isSafeDesktopIconPath(rawDesktopIcon) ? rawDesktopIcon : ''

  const rawPort =
    typeof source.port === 'number'
      ? source.port
      : typeof source.port === 'string' && source.port.trim()
        ? Number(source.port.trim())
        : Number.NaN

  return {
    name: normalizeAppName(source.name),
    iconPath,
    desktopIconPath,
    port: isValidAppPort(rawPort) ? rawPort : DEFAULT_APP_PORT,
  }
}

export function resolveAppIconSrc(iconPath: string): string {
  return iconPath && isSafeAppIconPath(iconPath) ? iconPath : DEFAULT_APP_ICON_URL
}

export function resolveAppFaviconSrc(iconPath: string): string {
  return iconPath && isSafeAppIconPath(iconPath) ? iconPath : DEFAULT_FAVICON_URL
}

let cachedRaw: string | null = null
let cachedSnapshot: AppSettings = DEFAULT_APP_SETTINGS

function areAppSettingsEqual(a: AppSettings, b: AppSettings): boolean {
  return (
    a.name === b.name &&
    a.iconPath === b.iconPath &&
    a.desktopIconPath === b.desktopIconPath &&
    a.port === b.port
  )
}

export function readAppSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_SETTINGS
  }

  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  } catch {
    return cachedSnapshot
  }

  if (raw === cachedRaw) {
    return cachedSnapshot
  }

  let next = DEFAULT_APP_SETTINGS
  if (raw) {
    try {
      next = normalizeAppSettings(JSON.parse(raw))
    } catch {
      next = DEFAULT_APP_SETTINGS
    }
  }

  cachedRaw = raw
  if (!areAppSettingsEqual(cachedSnapshot, next)) {
    cachedSnapshot = next
  }
  return cachedSnapshot
}

export function getServerAppSettingsSnapshot(): AppSettings {
  return DEFAULT_APP_SETTINGS
}

export function writeAppSettings(settings: AppSettings) {
  if (typeof window === 'undefined') {
    return
  }

  const normalized = normalizeAppSettings(settings)
  const serialized = JSON.stringify(normalized)
  try {
    window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, serialized)
  } catch {
    // Ignore storage access failures.
  }
  cachedRaw = serialized
  if (!areAppSettingsEqual(cachedSnapshot, normalized)) {
    cachedSnapshot = normalized
  }
}

export function notifyAppSettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(APP_SETTINGS_EVENT))
}

export function subscribeAppSettings(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === APP_SETTINGS_STORAGE_KEY) {
      listener()
    }
  }

  window.addEventListener(APP_SETTINGS_EVENT, listener)
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener(APP_SETTINGS_EVENT, listener)
    window.removeEventListener('storage', handleStorage)
  }
}

export async function getAppSettingsApi(): Promise<AppSettingsResponse> {
  const response = await api.request<AppSettingsResponse>({
    method: 'GET',
    url: '/settings/app',
  })
  return response.data
}

export async function updateAppSettingsApi(patch: AppSettingsPatch): Promise<AppSettingsResponse> {
  const response = await api.request<AppSettingsResponse>({
    method: 'POST',
    url: '/settings/app',
    data: patch,
  })
  return response.data
}

export async function uploadAppIconApi(data: FormData): Promise<AppSettingsResponse> {
  const response = await api.request<AppSettingsResponse>({
    method: 'POST',
    url: '/settings/app/icon',
    data,
  })
  return response.data
}

export async function resetAppIconApi(): Promise<AppSettingsResponse> {
  const response = await api.request<AppSettingsResponse>({
    method: 'DELETE',
    url: '/settings/app/icon',
  })
  return response.data
}
