import fs from 'node:fs/promises'
import path from 'node:path'

import type { ExternalImportPlatform } from '@/types/platform-import'

export type NormalizedImageSource =
  | { kind: 'file'; filePath: string }
  | { kind: 'buffer'; data: Buffer; hintExt?: string }
  | { kind: 'url'; url: string }
  | { kind: 'lazy-buffer'; read: () => Promise<Buffer | null>; hintExt?: string }

export type NormalizedImportPlayRecord = {
  playDate: string
  playTime: number
}

export type NormalizedImportWebsite = {
  name: string
  url: string
}

export type NormalizedImportMemory = {
  title: string
  description: string
  createdAt?: string
  imageSource?: NormalizedImageSource
}

export type NormalizedImportCharacter = {
  vndbId: string
  name: string
  original: string
  description: string
  bloodType: string
  height: number | null
  weight: number | null
  bust: number | null
  waist: number | null
  hips: number | null
  age: number | null
  birthdayMonth: number | null
  birthdayDay: number | null
  sex: string
  gender: string
  imageSource?: NormalizedImageSource
}

export type NormalizedImportExternalId = {
  provider: string
  externalId: string
}

export type NormalizedImportGame = {
  sourceId: string
  name: string
  nameCn: string
  date: string
  summary: string
  tags: string[]
  nsfw: boolean
  aliases: string[]
  platforms: string[]
  gameType: string
  gameEngine: string
  music: string
  script: string
  graphic: string
  originalPainter: string
  animationProduction: string
  developer: string
  publisher: string
  programmer: string
  exePath: string
  saveDir: string
  totalPlayTime: number
  playCount: number
  rating: number
  lastLaunchedAt: string
  playStatus: number
  completedAt: string
  addedAt: string
  images: {
    cover?: NormalizedImageSource
    bg?: NormalizedImageSource
    icon?: NormalizedImageSource
    logo?: NormalizedImageSource
  }
  collections: string[]
  records: NormalizedImportPlayRecord[]
  websites: NormalizedImportWebsite[]
  externalIds: NormalizedImportExternalId[]
  memories: NormalizedImportMemory[]
  characters: NormalizedImportCharacter[]
}

export type ParsedPlatformData = {
  platform: ExternalImportPlatform
  detectedFormat: string
  games: NormalizedImportGame[]
  warnings: string[]
  tempDir?: string
}

const HTML_ENTITY_MAP: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
}

export function stripHtmlToText(raw: string): string {
  if (!raw) return ''

  let text = raw
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(?:p|div|li|h[1-6]|tr|blockquote)\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')

  text = text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (full, entity: string) => {
    const lower = entity.toLowerCase()
    if (Object.hasOwn(HTML_ENTITY_MAP, lower)) {
      return HTML_ENTITY_MAP[lower]
    }
    if (lower.startsWith('#x')) {
      const code = Number.parseInt(lower.slice(2), 16)
      if (Number.isFinite(code) && code >= 0 && code <= 0x10ffff) {
        return String.fromCodePoint(code)
      }
    }
    if (lower.startsWith('#')) {
      const code = Number.parseInt(lower.slice(1), 10)
      if (Number.isFinite(code) && code >= 0 && code <= 0x10ffff) {
        return String.fromCodePoint(code)
      }
    }
    return full
  })

  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function normalizeIsoDateOnly(input: unknown): string {
  if (input === null || input === undefined) return ''

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return ''
    const year = input.getUTCFullYear()
    if (year < 1970 || year > 2100) return ''
    return input.toISOString().slice(0, 10)
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input <= 0) return ''
    const d = new Date(input)
    return normalizeIsoDateOnly(d)
  }

  if (typeof input !== 'string') return ''
  const raw = input.trim()
  if (!raw || raw.startsWith('0001-')) return ''

  const ymdMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(raw)
  if (ymdMatch) {
    const year = Number(ymdMatch[1])
    const month = Number(ymdMatch[2])
    const day = Number(ymdMatch[3])
    if (year < 1970 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      return ''
    }
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const ymMatch = /^(\d{4})[-/](\d{1,2})$/.exec(raw)
  if (ymMatch) {
    const year = Number(ymMatch[1])
    const month = Number(ymMatch[2])
    if (year < 1970 || year > 2100 || month < 1 || month > 12) return ''
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
  }

  const yMatch = /^(\d{4})$/.exec(raw)
  if (yMatch) {
    const year = Number(yMatch[1])
    if (year < 1970 || year > 2100) return ''
    return String(year)
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return normalizeIsoDateOnly(parsed)
}

export function normalizeIsoDateTime(input: unknown): string {
  if (input === null || input === undefined) return ''

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return ''
    const year = input.getUTCFullYear()
    if (year < 1970 || year > 2100) return ''
    return input.toISOString()
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input <= 0) return ''
    return normalizeIsoDateTime(new Date(input))
  }

  if (typeof input !== 'string') return ''
  const raw = input.trim()
  if (!raw || raw.startsWith('0001-')) return ''

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return normalizeIsoDateTime(parsed)
}

export function extractExternalIdsFromUrls(urls: string[]): NormalizedImportExternalId[] {
  const seen = new Set<string>()
  const result: NormalizedImportExternalId[] = []

  const add = (provider: string, externalId: string) => {
    const trimmed = externalId.trim()
    if (!trimmed) return
    const key = `${provider}:${trimmed}`
    if (seen.has(key)) return
    seen.add(key)
    result.push({ provider, externalId: trimmed })
  }

  for (const rawUrl of urls) {
    const url = rawUrl.trim()
    if (!url) continue

    const vndbMatch = /https?:\/\/(?:www\.)?vndb\.org\/(v\d+)/i.exec(url)
    if (vndbMatch) {
      add('vndb', vndbMatch[1].toLowerCase())
      continue
    }

    const bgmMatch = /https?:\/\/(?:www\.)?(?:bgm\.tv|bangumi\.tv|chii\.in)\/subject\/(\d+)/i.exec(
      url,
    )
    if (bgmMatch) {
      add('bangumi', bgmMatch[1])
      continue
    }

    const steamMatch =
      /https?:\/\/(?:store\.steampowered\.com|steamcommunity\.com)\/app\/(\d+)/i.exec(url)
    if (steamMatch) {
      add('steam', steamMatch[1])
      continue
    }

    const ymgalMatch = /https?:\/\/(?:www\.)?ymgal\.games\/(?:ga|game\/)(\d+)/i.exec(url)
    if (ymgalMatch) {
      add('ymgal', ymgalMatch[1])
    }
  }

  return result
}

export function normalizeNameForMatch(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function normalizeLooseNameForMatch(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '')
    .trim()
}

export function normalizeExternalIdPair(provider: string, externalId: string): string {
  let normalizedProvider = provider.trim().toLowerCase()
  if (normalizedProvider === 'bgm') {
    normalizedProvider = 'bangumi'
  }
  let normalizedId = externalId.trim()
  if (!normalizedProvider || !normalizedId) return ''

  if (normalizedProvider === 'vndb') {
    normalizedId = normalizedId.toLowerCase()
    if (/^\d+$/.test(normalizedId)) {
      normalizedId = `v${normalizedId}`
    }
  } else if (normalizedProvider === 'ymgal') {
    normalizedId = normalizedId.replace(/^[gG][aA]/, '')
  } else {
    normalizedId = normalizedId.toLowerCase()
  }

  return `${normalizedProvider}:${normalizedId}`
}

export function dedupeStringList(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of values) {
    const trimmed = raw.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

export async function safeExtractZipToDir(
  bufferOrPath: Buffer | string,
  targetDir: string,
): Promise<void> {
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip(bufferOrPath)
  const resolvedRoot = path.resolve(targetDir)
  await fs.mkdir(resolvedRoot, { recursive: true })

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue

    const normalizedName = entry.entryName.replace(/\\/g, '/').replace(/^\/+/, '')
    if (!normalizedName) continue

    const segments = normalizedName.split('/').filter((seg) => seg && seg !== '.')
    if (segments.length === 0 || segments.some((seg) => seg === '..')) continue

    const targetPath = path.resolve(resolvedRoot, ...segments)
    if (!targetPath.startsWith(resolvedRoot + path.sep)) continue

    await fs.mkdir(path.dirname(targetPath), { recursive: true })
    await fs.writeFile(targetPath, entry.getData())
  }
}

export function createEmptyNormalizedGame(sourceId: string): NormalizedImportGame {
  return {
    sourceId,
    name: '',
    nameCn: '',
    date: '',
    summary: '',
    tags: [],
    nsfw: false,
    aliases: [],
    platforms: [],
    gameType: '',
    gameEngine: '',
    music: '',
    script: '',
    graphic: '',
    originalPainter: '',
    animationProduction: '',
    developer: '',
    publisher: '',
    programmer: '',
    exePath: '',
    saveDir: '',
    totalPlayTime: 0,
    playCount: 0,
    rating: 0,
    lastLaunchedAt: '',
    playStatus: 0,
    completedAt: '',
    addedAt: '',
    images: {},
    collections: [],
    records: [],
    websites: [],
    externalIds: [],
    memories: [],
    characters: [],
  }
}
