import { api } from '@/lib/request-utils'

export type StartupMediaKind = 'image' | 'video'

export type StartupImageConfig = {
  mediaPath: string
  mediaWidth: number | null
  mediaHeight: number | null
  matchMediaWindowSize: boolean
  durationMs: number
  skippable: boolean
}

export type StartupVideoConfig = {
  mediaPath: string
  mediaWidth: number | null
  mediaHeight: number | null
  matchMediaWindowSize: boolean
  muted: boolean
  skippable: boolean
}

export type StartupSettings = {
  enabled: boolean
  activeType: StartupMediaKind
  image: StartupImageConfig
  video: StartupVideoConfig
}

export type StartupSettingsPatch = {
  enabled?: boolean
  activeType?: StartupMediaKind
  image?: Partial<StartupImageConfig>
  video?: Partial<StartupVideoConfig>
}

export type ActiveStartupMedia = {
  mediaType: StartupMediaKind
  mediaPath: string
  mediaWidth: number | null
  mediaHeight: number | null
  matchMediaWindowSize: boolean
  durationMs: number
  muted: boolean
  skippable: boolean
}

export const STARTUP_SETTINGS_STORAGE_KEY = 'vnweb:startup-settings'
export const STARTUP_SETTINGS_EVENT = 'vnweb:startup-settings-changed'
export const DEFAULT_STARTUP_DURATION_MS = 2000
export const MIN_STARTUP_DURATION_MS = 500
export const MAX_STARTUP_DURATION_MS = 10000
const MAX_STARTUP_MEDIA_DIMENSION = 16384

export const DEFAULT_STARTUP_IMAGE_CONFIG: StartupImageConfig = {
  mediaPath: '',
  mediaWidth: null,
  mediaHeight: null,
  matchMediaWindowSize: true,
  durationMs: DEFAULT_STARTUP_DURATION_MS,
  skippable: true,
}

export const DEFAULT_STARTUP_VIDEO_CONFIG: StartupVideoConfig = {
  mediaPath: '',
  mediaWidth: null,
  mediaHeight: null,
  matchMediaWindowSize: true,
  muted: false,
  skippable: true,
}

export const DEFAULT_STARTUP_SETTINGS: StartupSettings = {
  enabled: false,
  activeType: 'image',
  image: DEFAULT_STARTUP_IMAGE_CONFIG,
  video: DEFAULT_STARTUP_VIDEO_CONFIG,
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeDimension(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
    return null
  }
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return null
  }
  const rounded = Math.round(num)
  return rounded >= 1 && rounded <= MAX_STARTUP_MEDIA_DIMENSION ? rounded : null
}

export function isSafeStartupMediaPath(value: string): boolean {
  const clean = value.split(/[?#]/)[0]?.trim() ?? ''
  if (!clean.startsWith('/assets/startup/')) return false
  const fileName = clean.slice('/assets/startup/'.length)
  if (!fileName || fileName === '.' || fileName === '..') return false
  return !fileName.includes('/') && !fileName.includes('\\') && !fileName.includes('..')
}

function normalizeSlotBase(source: Record<string, unknown>) {
  const rawPath = typeof source.mediaPath === 'string' ? source.mediaPath.trim() : ''
  const validPath = rawPath && isSafeStartupMediaPath(rawPath) ? rawPath : ''
  const rawWidth = validPath ? normalizeDimension(source.mediaWidth) : null
  const rawHeight = validPath ? normalizeDimension(source.mediaHeight) : null
  const hasValidDimensions = rawWidth !== null && rawHeight !== null

  return {
    mediaPath: validPath,
    mediaWidth: hasValidDimensions ? rawWidth : null,
    mediaHeight: hasValidDimensions ? rawHeight : null,
    matchMediaWindowSize:
      typeof source.matchMediaWindowSize === 'boolean' ? source.matchMediaWindowSize : true,
    skippable: typeof source.skippable === 'boolean' ? source.skippable : true,
  }
}

function normalizeImageSlot(input: unknown): StartupImageConfig {
  const source = isPlainRecord(input) ? input : {}
  const rawDuration = Number(source.durationMs)
  const durationMs = Number.isFinite(rawDuration)
    ? Math.min(MAX_STARTUP_DURATION_MS, Math.max(MIN_STARTUP_DURATION_MS, Math.round(rawDuration)))
    : DEFAULT_STARTUP_DURATION_MS

  return {
    ...normalizeSlotBase(source),
    durationMs,
  }
}

function normalizeVideoSlot(input: unknown): StartupVideoConfig {
  const source = isPlainRecord(input) ? input : {}
  return {
    ...normalizeSlotBase(source),
    muted: typeof source.muted === 'boolean' ? source.muted : false,
  }
}

export function normalizeStartupSettings(
  input: StartupSettingsPatch | StartupSettings | Record<string, unknown> | null | undefined,
): StartupSettings {
  const source: Record<string, unknown> = isPlainRecord(input) ? input : {}
  const enabled =
    typeof source.enabled === 'boolean' ? source.enabled : DEFAULT_STARTUP_SETTINGS.enabled

  if (isPlainRecord(source.image) || isPlainRecord(source.video)) {
    const activeType: StartupMediaKind = source.activeType === 'video' ? 'video' : 'image'
    return {
      enabled,
      activeType,
      image: normalizeImageSlot(source.image),
      video: normalizeVideoSlot(source.video),
    }
  }

  const legacyType =
    source.mediaType === 'video' ? 'video' : source.mediaType === 'image' ? 'image' : 'none'
  const activeType: StartupMediaKind =
    legacyType === 'video' || source.activeType === 'video' ? 'video' : 'image'
  const imageSource =
    legacyType === 'image' || (legacyType === 'none' && activeType === 'image') ? source : {}
  const videoSource =
    legacyType === 'video' || (legacyType === 'none' && activeType === 'video') ? source : {}

  return {
    enabled,
    activeType,
    image: normalizeImageSlot(imageSource),
    video: normalizeVideoSlot(videoSource),
  }
}

export function getActiveStartupMedia(settings: StartupSettings): ActiveStartupMedia {
  if (settings.activeType === 'video') {
    return {
      mediaType: 'video',
      ...settings.video,
      durationMs: DEFAULT_STARTUP_DURATION_MS,
    }
  }

  return {
    mediaType: 'image',
    ...settings.image,
    muted: false,
  }
}

export function readStartupSettings(): StartupSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_STARTUP_SETTINGS
  }

  const raw = window.localStorage.getItem(STARTUP_SETTINGS_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_STARTUP_SETTINGS
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeStartupSettings(parsed)
  } catch {
    return DEFAULT_STARTUP_SETTINGS
  }
}

export function writeStartupSettings(settings: StartupSettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    STARTUP_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeStartupSettings(settings)),
  )
}

export function notifyStartupSettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(STARTUP_SETTINGS_EVENT))
}

export async function getStartupConfigApi(): Promise<{ data: StartupSettings }> {
  const response = await api.request<{ data: StartupSettings }>({
    method: 'GET',
    url: '/settings/appearance/startup',
  })
  return response.data
}

export async function updateStartupConfigApi(
  patch: StartupSettingsPatch,
): Promise<{ data: StartupSettings }> {
  const response = await api.request<{ data: StartupSettings }>({
    method: 'POST',
    url: '/settings/appearance/startup',
    data: patch,
  })
  return response.data
}

export async function uploadStartupMediaApi(
  data: FormData,
): Promise<{ data: { path: string; mediaType: StartupMediaKind } }> {
  const response = await api.request<{ data: { path: string; mediaType: StartupMediaKind } }>({
    method: 'POST',
    url: '/settings/appearance/startup/upload',
    data,
  })
  return response.data
}

export async function renameStartupMediaApi(
  mediaType: StartupMediaKind,
  name: string,
): Promise<{ data: StartupSettings }> {
  const response = await api.request<{ data: StartupSettings }>({
    method: 'PATCH',
    url: '/settings/appearance/startup',
    data: { mediaType, name },
  })
  return response.data
}
