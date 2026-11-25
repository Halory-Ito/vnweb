import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { getDataSettingsDir } from '@/lib/server/runtime-paths.mjs'
import {
  BANGUMI_OFFICIAL_API_URL,
  BANGUMI_OFFICIAL_BASE_URL,
  BANGUMI_OFFICIAL_TOKEN_URL,
} from '@/lib/settings/bangumi-settings'
import {
  DEFAULT_ENHANCED_QUALITY,
  isEnhancedQuality,
  type EnhancedQuality,
} from '@/lib/settings/enhanced-quality'
import {
  DEFAULT_METING_BITRATE,
  DEFAULT_METING_COVER_SIZE,
  isMetingBitrate,
  isMetingCoverSize,
} from '@/lib/settings/meting-settings'

export type PlatformKey =
  | 'steam'
  | 'bangumi'
  | 'vndb'
  | 'ymgal'
  | 'steamgriddb'
  | 'meting'
  | 'enhanced'

export type SteamPlatformConfig = {
  apiKey: string
}

export type BangumiPlatformConfig = {
  useMirror: boolean
  mirrorUrl: string
  baseUrl: string
  tokenUrl: string
}

export type VndbPlatformConfig = {
  baseUrl: string
  oauthToken: string
  oauthClientId: string
  oauthClientSecret: string
  oauthAuthorizeUrl: string
  oauthTokenUrl: string
  oauthUserInfoUrl: string
  oauthScope: string
}

export type YmgalPlatformConfig = {
  baseUrl: string
  clientId: string
  clientSecret: string
  oauthClientId: string
  oauthClientSecret: string
}

export type SteamGridDBPlatformConfig = {
  apiKey: string
  baseUrl: string
}

export type MetingPlatformConfig = {
  bitrate: number
  coverSize: number
  neteaseCookie: string
}

export type EnhancedPlatformConfig = {
  useLocalSdk: boolean
  apiBase: string
  musicU: string
  quality: EnhancedQuality
  sdkPort: number
}

export type PlatformSettingsData = {
  steam: SteamPlatformConfig
  bangumi: BangumiPlatformConfig
  vndb: VndbPlatformConfig
  ymgal: YmgalPlatformConfig
  steamgriddb: SteamGridDBPlatformConfig
  meting: MetingPlatformConfig
  enhanced: EnhancedPlatformConfig
}

const SECRET_FIELDS: Record<PlatformKey, readonly string[]> = {
  steam: ['apiKey'],
  bangumi: [],
  vndb: ['oauthToken', 'oauthClientSecret'],
  ymgal: ['clientSecret', 'oauthClientSecret'],
  steamgriddb: ['apiKey'],
  meting: ['neteaseCookie'],
  enhanced: ['musicU'],
}

const URL_FIELDS: ReadonlySet<string> = new Set([
  'mirrorUrl',
  'baseUrl',
  'tokenUrl',
  'apiBase',
  'oauthAuthorizeUrl',
  'oauthTokenUrl',
  'oauthUserInfoUrl',
])

export class InvalidPlatformSettingsError extends Error {}

function trimTrailingSlash(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function getDefaultPlatformSettings(): PlatformSettingsData {
  return {
    steam: {
      apiKey: '',
    },
    bangumi: {
      useMirror: false,
      mirrorUrl: '',
      baseUrl: '',
      tokenUrl: '',
    },
    vndb: {
      baseUrl: 'https://api.vndb.org/kana',
      oauthToken: '',
      oauthClientId: '',
      oauthClientSecret: '',
      oauthAuthorizeUrl: 'https://vndb.org/oauth/authorize',
      oauthTokenUrl: 'https://vndb.org/oauth/token',
      oauthUserInfoUrl: 'https://api.vndb.org/kana/authinfo',
      oauthScope: '',
    },
    ymgal: {
      baseUrl: 'https://www.ymgal.games',
      clientId: '',
      clientSecret: '',
      oauthClientId: '',
      oauthClientSecret: '',
    },
    steamgriddb: {
      apiKey: '',
      baseUrl: 'https://www.steamgriddb.com/api/v2',
    },
    meting: {
      bitrate: DEFAULT_METING_BITRATE,
      coverSize: DEFAULT_METING_COVER_SIZE,
      neteaseCookie: '',
    },
    enhanced: {
      useLocalSdk: false,
      apiBase: 'https://music.163.com/api',
      musicU: '',
      quality: DEFAULT_ENHANCED_QUALITY,
      sdkPort: 3001,
    },
  }
}

export function resolveBangumiEndpoints(bangumi: BangumiPlatformConfig): {
  apiUrl: string
  baseUrl: string
  tokenUrl: string
} {
  if (!bangumi.useMirror) {
    return {
      apiUrl: BANGUMI_OFFICIAL_API_URL,
      baseUrl: BANGUMI_OFFICIAL_BASE_URL,
      tokenUrl: BANGUMI_OFFICIAL_TOKEN_URL,
    }
  }
  return {
    apiUrl: trimTrailingSlash(bangumi.mirrorUrl || BANGUMI_OFFICIAL_API_URL),
    baseUrl: trimTrailingSlash(bangumi.baseUrl || BANGUMI_OFFICIAL_BASE_URL),
    tokenUrl: trimTrailingSlash(bangumi.tokenUrl || BANGUMI_OFFICIAL_TOKEN_URL),
  }
}

export function resolveEnhancedApiBase(enhanced: EnhancedPlatformConfig): string {
  if (enhanced.useLocalSdk) {
    const port =
      Number.isInteger(enhanced.sdkPort) && enhanced.sdkPort >= 1024 && enhanced.sdkPort <= 65535
        ? enhanced.sdkPort
        : 3001
    return `http://127.0.0.1:${port}`
  }
  return trimTrailingSlash(enhanced.apiBase || 'https://music.163.com/api')
}

export function maskSecretValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length <= 8) return '********'
  return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`
}

function isMaskedValue(incoming: string, original: string): boolean {
  if (!incoming) return false
  if (incoming === '********') return true
  if (original && incoming === maskSecretValue(original)) return true
  return false
}

function normalizeUrlValue(value: string): string {
  const trimmed = trimTrailingSlash(value)
  if (!trimmed) return ''
  const parsed = URL.canParse(trimmed) ? new URL(trimmed) : null
  if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
    throw new InvalidPlatformSettingsError('地址必须以 http:// 或 https:// 开头')
  }
  return trimmed
}

function mergeWithDefaults(raw: Partial<PlatformSettingsData>): PlatformSettingsData {
  const defaults = getDefaultPlatformSettings()
  return {
    steam: { ...defaults.steam, ...raw.steam },
    bangumi: {
      useMirror: raw.bangumi?.useMirror ?? defaults.bangumi.useMirror,
      mirrorUrl: raw.bangumi?.mirrorUrl ?? defaults.bangumi.mirrorUrl,
      baseUrl: raw.bangumi?.baseUrl ?? defaults.bangumi.baseUrl,
      tokenUrl: raw.bangumi?.tokenUrl ?? defaults.bangumi.tokenUrl,
    },
    vndb: { ...defaults.vndb, ...raw.vndb },
    ymgal: { ...defaults.ymgal, ...raw.ymgal },
    steamgriddb: { ...defaults.steamgriddb, ...raw.steamgriddb },
    meting: {
      bitrate:
        raw.meting && isMetingBitrate(raw.meting.bitrate)
          ? raw.meting.bitrate
          : DEFAULT_METING_BITRATE,
      coverSize:
        raw.meting && isMetingCoverSize(raw.meting.coverSize)
          ? raw.meting.coverSize
          : DEFAULT_METING_COVER_SIZE,
      neteaseCookie: typeof raw.meting?.neteaseCookie === 'string' ? raw.meting.neteaseCookie : '',
    },
    enhanced: {
      ...defaults.enhanced,
      ...raw.enhanced,
      quality: isEnhancedQuality(raw.enhanced?.quality)
        ? raw.enhanced.quality
        : DEFAULT_ENHANCED_QUALITY,
    },
  }
}

function getPlatformSettingsFile(): string {
  return path.join(getDataSettingsDir(), 'platform.json')
}

async function writePlatformSettingsFile(data: PlatformSettingsData): Promise<void> {
  const filePath = getPlatformSettingsFile()
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  const temporary = `${filePath}.${randomUUID()}.tmp`
  try {
    await fs.promises.writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600 })
    await fs.promises.rename(temporary, filePath)
  } finally {
    await fs.promises.rm(temporary, { force: true })
  }
}

const platformFileState = globalThis as typeof globalThis & {
  platformSettingsQueue?: Promise<void>
}

function queuePlatformFileOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = (platformFileState.platformSettingsQueue ?? Promise.resolve()).then(operation)
  platformFileState.platformSettingsQueue = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

function isSettingsRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

async function readOrInitializePlatformSettings(): Promise<PlatformSettingsData> {
  let content: string
  try {
    content = await fs.promises.readFile(getPlatformSettingsFile(), 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    const initial = getDefaultPlatformSettings()
    await writePlatformSettingsFile(initial)
    return initial
  }

  const parsed: unknown = JSON.parse(content)
  if (!isSettingsRecord(parsed)) throw new Error('平台配置文件格式无效')
  for (const [platform, defaults] of Object.entries(getDefaultPlatformSettings())) {
    const config = parsed[platform]
    if (config === undefined) continue
    if (!isSettingsRecord(config)) throw new Error('平台配置文件格式无效')
    for (const [field, defaultValue] of Object.entries(defaults)) {
      const value = config[field]
      if (value === undefined || typeof value === typeof defaultValue) continue
      if (typeof defaultValue === 'boolean' && (value === 'true' || value === 'false')) {
        config[field] = value === 'true'
        continue
      }
      throw new Error('平台配置文件字段类型无效')
    }
  }
  return mergeWithDefaults(parsed)
}

/** 读取平台配置，首次缺少文件时初始化默认值。 */
export function readPlatformSettings(): Promise<PlatformSettingsData> {
  return queuePlatformFileOperation(readOrInitializePlatformSettings)
}

export async function readSteamApiKey() {
  return (await readPlatformSettings()).steam.apiKey
}

/** 对敏感字段脱敏，安全返回给客户端展示 */
export function maskPlatformSettings(data: PlatformSettingsData): PlatformSettingsData {
  const masked = structuredClone(data)
  for (const key of Object.keys(SECRET_FIELDS) as PlatformKey[]) {
    const record = masked[key] as Record<string, string>
    for (const field of SECRET_FIELDS[key]) {
      const value = record[field] ?? ''
      record[field] =
        (field === 'musicU' || field === 'neteaseCookie') && value
          ? '********'
          : maskSecretValue(value)
    }
  }
  return masked
}

/** 更新单个平台的配置并持久化到 data/settings/platform.json（保留未修改的脱敏密钥） */
export function updatePlatformSettings<K extends PlatformKey>(
  platform: K,
  patch: Partial<PlatformSettingsData[K]>,
): Promise<PlatformSettingsData> {
  return queuePlatformFileOperation(async () => {
    const current = await readOrInitializePlatformSettings()
    const next = applyPlatformSettingsPatch(current, platform, patch)
    await writePlatformSettingsFile(next)
    return next
  })
}

function applyPlatformSettingsPatch<K extends PlatformKey>(
  current: PlatformSettingsData,
  platform: K,
  patch: Partial<PlatformSettingsData[K]>,
): PlatformSettingsData {
  const defaults: Record<string, unknown> = getDefaultPlatformSettings()[platform]
  const storedRecord = { ...(current[platform] as Record<string, unknown>) }
  const secretSet = new Set(SECRET_FIELDS[platform])

  for (const [field, rawValue] of Object.entries(patch as Record<string, unknown>)) {
    if (!Object.hasOwn(defaults, field)) {
      throw new InvalidPlatformSettingsError(`不支持的配置字段：${field}`)
    }
    if (typeof rawValue !== typeof defaults[field]) {
      throw new InvalidPlatformSettingsError(`配置字段类型无效：${field}`)
    }

    if (platform === 'enhanced' && field === 'quality' && !isEnhancedQuality(rawValue)) {
      throw new InvalidPlatformSettingsError('请选择有效的默认音质')
    }
    if (platform === 'meting' && field === 'bitrate' && !isMetingBitrate(rawValue)) {
      throw new InvalidPlatformSettingsError('请选择有效的 Meting 播放码率')
    }
    if (platform === 'meting' && field === 'coverSize' && !isMetingCoverSize(rawValue)) {
      throw new InvalidPlatformSettingsError('请选择有效的 Meting 封面尺寸')
    }

    if (typeof rawValue === 'boolean') {
      storedRecord[field] = rawValue
      continue
    }

    if (typeof rawValue === 'number') {
      if (
        field === 'sdkPort' &&
        (!Number.isInteger(rawValue) || rawValue < 1024 || rawValue > 65535)
      ) {
        throw new InvalidPlatformSettingsError('端口必须是 1024 至 65535 之间的整数')
      }
      storedRecord[field] = rawValue
      continue
    }

    if (typeof rawValue !== 'string') continue

    const trimmed = rawValue.trim()
    if (secretSet.has(field)) {
      const original = typeof storedRecord[field] === 'string' ? storedRecord[field] : ''
      if (isMaskedValue(trimmed, original)) {
        continue
      }
      if (field === 'neteaseCookie' && /[^\x20-\x7E]/.test(trimmed)) {
        throw new InvalidPlatformSettingsError('请输入单行网易云 Cookie')
      }
      if (
        field === 'musicU' &&
        (trimmed.startsWith('MUSIC_U=') || /[^\x21-\x7E]|[",;\\]/.test(trimmed))
      ) {
        throw new InvalidPlatformSettingsError('请输入单独的 MUSIC_U 值')
      }
      storedRecord[field] = trimmed
      continue
    }

    if (URL_FIELDS.has(field)) {
      storedRecord[field] = normalizeUrlValue(trimmed)
      continue
    }

    storedRecord[field] = trimmed
  }

  return {
    ...current,
    [platform]: storedRecord as PlatformSettingsData[K],
  }
}
