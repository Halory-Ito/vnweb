export type FontSettings = {
  fontPath: string
  fontSize: number
  fontWeight: number
}

export const FONT_SETTINGS_STORAGE_KEY = 'vnweb:font-settings'
export const FONT_SETTINGS_EVENT = 'vnweb:font-settings-changed'

const APP_FONT_FAMILY_NAME = 'VNWebCustomFont'

/**
 * 以 `system:` 开头的 fontPath 表示不加载字体文件，
 * 直接把 CSS 通用字体族交给浏览器解析（浏览器会应用用户设置的 serif / sans-serif / monospace 字体）。
 */
export const BROWSER_FONT_PREFIX = 'system:'

export const BROWSER_FONT_FAMILIES = ['serif', 'sans-serif', 'monospace'] as const

export type BrowserFontFamily = (typeof BROWSER_FONT_FAMILIES)[number]

const BROWSER_FONT_LABELS: Record<BrowserFontFamily, { full: string; short: string }> = {
  serif: { full: '衬线（serif）', short: '衬线' },
  'sans-serif': { full: '无衬线（sans-serif）', short: '无衬线' },
  monospace: { full: '等宽（monospace）', short: '等宽' },
}

export type BrowserFontOption = {
  fontPath: string
  family: BrowserFontFamily
  label: string
  shortLabel: string
}

export const BROWSER_FONT_OPTIONS: BrowserFontOption[] = BROWSER_FONT_FAMILIES.map((family) => ({
  family,
  fontPath: `${BROWSER_FONT_PREFIX}${family}`,
  label: BROWSER_FONT_LABELS[family].full,
  shortLabel: BROWSER_FONT_LABELS[family].short,
}))

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  fontPath: `${BROWSER_FONT_PREFIX}serif`,
  fontSize: 16,
  fontWeight: 400,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

let loadedFontPath = ''

export function getBrowserFontFamily(fontPath: string): BrowserFontFamily | null {
  if (!fontPath.startsWith(BROWSER_FONT_PREFIX)) {
    return null
  }

  const family = fontPath.slice(BROWSER_FONT_PREFIX.length) as BrowserFontFamily
  return BROWSER_FONT_FAMILIES.includes(family) ? family : null
}

export function getBrowserFontLabel(fontPath: string): string | null {
  const family = getBrowserFontFamily(fontPath)
  return family ? BROWSER_FONT_LABELS[family].full : null
}

function resolveFontPath(input: Partial<FontSettings> | FontSettings): string {
  if (typeof input.fontPath !== 'string') {
    return DEFAULT_FONT_SETTINGS.fontPath
  }

  const trimmed = input.fontPath.trim()
  if (!trimmed) {
    return DEFAULT_FONT_SETTINGS.fontPath
  }

  // 非法或已废弃的 system: 值回退到默认设置
  if (trimmed.startsWith(BROWSER_FONT_PREFIX) && !getBrowserFontFamily(trimmed)) {
    return DEFAULT_FONT_SETTINGS.fontPath
  }

  return trimmed
}

export function normalizeFontSettings(input: Partial<FontSettings> | FontSettings): FontSettings {
  const fontSize = Number(input.fontSize ?? DEFAULT_FONT_SETTINGS.fontSize)
  const fontWeight = Number(input.fontWeight ?? DEFAULT_FONT_SETTINGS.fontWeight)

  return {
    fontPath: resolveFontPath(input),
    fontSize: clamp(Number.isFinite(fontSize) ? Math.round(fontSize) : 16, 10, 40),
    fontWeight: clamp(
      Number.isFinite(fontWeight) ? Math.round(fontWeight / 100) * 100 : 400,
      100,
      900,
    ),
  }
}

export function readFontSettings(): FontSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_FONT_SETTINGS
  }

  const raw = window.localStorage.getItem(FONT_SETTINGS_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_FONT_SETTINGS
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FontSettings>
    return normalizeFontSettings(parsed)
  } catch {
    return DEFAULT_FONT_SETTINGS
  }
}

export function writeFontSettings(settings: FontSettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    FONT_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeFontSettings(settings)),
  )
}

export function notifyFontSettingsChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(FONT_SETTINGS_EVENT))
}

function removeRuntimeFontFaces() {
  if (typeof document === 'undefined') {
    return
  }

  for (const face of Array.from(document.fonts)) {
    if (face.family.replace(/['"]/g, '') === APP_FONT_FAMILY_NAME) {
      document.fonts.delete(face)
    }
  }

  loadedFontPath = ''
}

async function ensureFontFaceLoaded(fontPath: string) {
  if (typeof document === 'undefined' || !fontPath) {
    return
  }

  if (loadedFontPath === fontPath) {
    return
  }

  const safePath = fontPath.replace(/"/g, '')
  const fontFace = new FontFace(APP_FONT_FAMILY_NAME, `url("${safePath}")`)
  const loaded = await fontFace.load()

  removeRuntimeFontFaces()
  document.fonts.add(loaded)
  loadedFontPath = fontPath
}

export async function applyFontSettingsToDocument(settings: FontSettings) {
  if (typeof document === 'undefined') {
    return
  }

  const normalized = normalizeFontSettings(settings)
  const root = document.documentElement

  root.style.setProperty('--app-font-size', `${normalized.fontSize}px`)
  root.style.setProperty('--app-font-weight', String(normalized.fontWeight))

  const browserFamily = getBrowserFontFamily(normalized.fontPath)
  if (browserFamily) {
    removeRuntimeFontFaces()
    root.style.setProperty('--app-font-family', browserFamily)
    return
  }

  try {
    await ensureFontFaceLoaded(normalized.fontPath)
    root.style.setProperty('--app-font-family', `'${APP_FONT_FAMILY_NAME}', sans-serif`)
  } catch {
    root.style.setProperty('--app-font-family', 'sans-serif')
  }
}
