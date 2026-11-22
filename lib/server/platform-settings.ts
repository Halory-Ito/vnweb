import fs from 'node:fs'
import path from 'node:path'

import { PLATFORM_SETTINGS_FILE } from '@/lib/server/config-rw'
import {
  BANGUMI_OFFICIAL_API_URL,
  BANGUMI_OFFICIAL_BASE_URL,
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
  apiKey: string
  oauthClientId: string
  oauthClientSecret: string
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
  bangumi: ['apiKey', 'oauthClientSecret'],
  vndb: ['oauthToken', 'oauthClientSecret'],
  ymgal: ['clientSecret', 'oauthClientSecret'],
  steamgriddb: ['apiKey'],
  meting: ['neteaseCookie'],
  enhanced: ['musicU'],
}

const URL_FIELDS: ReadonlySet<string> = new Set([
  'mirrorUrl',
  'baseUrl',
  'apiBase',
  'oauthAuthorizeUrl',
  'oauthTokenUrl',
  'oauthUserInfoUrl',
])

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
      apiKey: '',
      oauthClientId: '',
      oauthClientSecret: '',
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
} {
  if (!bangumi.useMirror) {
    return {
      apiUrl: BANGUMI_OFFICIAL_API_URL,
      baseUrl: BANGUMI_OFFICIAL_BASE_URL,
    }
  }
  return {
    apiUrl: trimTrailingSlash(bangumi.mirrorUrl || BANGUMI_OFFICIAL_API_URL),
    baseUrl: trimTrailingSlash(bangumi.baseUrl || BANGUMI_OFFICIAL_BASE_URL),
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
  const parsed = new URL(trimmed)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('地址必须以 http:// 或 https:// 开头')
  }
  return trimmed
}

function mergeWithDefaults(raw: Partial<PlatformSettingsData>): PlatformSettingsData {
  const defaults = getDefaultPlatformSettings()
  return {
    steam: { ...defaults.steam, ...raw.steam },
    bangumi: { ...defaults.bangumi, ...raw.bangumi },
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

async function writePlatformSettingsFile(data: PlatformSettingsData): Promise<void> {
  await fs.promises.mkdir(path.dirname(PLATFORM_SETTINGS_FILE), { recursive: true })
  await fs.promises.writeFile(PLATFORM_SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

/** 读取 data/settings/platform.json（含真实密钥，仅服务端使用；首次自动初始化） */
export async function readPlatformSettings(): Promise<PlatformSettingsData> {
  if (fs.existsSync(PLATFORM_SETTINGS_FILE)) {
    try {
      const content = await fs.promises.readFile(PLATFORM_SETTINGS_FILE, 'utf-8')
      const parsed = JSON.parse(content) as Partial<PlatformSettingsData>
      return mergeWithDefaults(parsed)
    } catch {
      return getDefaultPlatformSettings()
    }
  }

  const initial = getDefaultPlatformSettings()

  await writePlatformSettingsFile(initial)
  return initial
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
export async function updatePlatformSettings<K extends PlatformKey>(
  platform: K,
  patch: Partial<PlatformSettingsData[K]>,
): Promise<PlatformSettingsData> {
  const current = await readPlatformSettings()
  const storedRecord = { ...(current[platform] as Record<string, unknown>) }
  const secretSet = new Set(SECRET_FIELDS[platform])

  for (const [field, rawValue] of Object.entries(patch as Record<string, unknown>)) {
    if (!(field in storedRecord)) continue

    if (platform === 'enhanced' && field === 'quality' && !isEnhancedQuality(rawValue)) {
      throw new Error('请选择有效的默认音质')
    }
    if (platform === 'meting' && field === 'bitrate' && !isMetingBitrate(rawValue)) {
      throw new Error('请选择有效的 Meting 播放码率')
    }
    if (platform === 'meting' && field === 'coverSize' && !isMetingCoverSize(rawValue)) {
      throw new Error('请选择有效的 Meting 封面尺寸')
    }

    if (typeof storedRecord[field] === 'boolean' && typeof rawValue === 'boolean') {
      storedRecord[field] = rawValue
      continue
    }

    if (
      typeof storedRecord[field] === 'number' &&
      typeof rawValue === 'number' &&
      Number.isFinite(rawValue)
    ) {
      storedRecord[field] = Math.trunc(rawValue)
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
        throw new Error('请输入单行网易云 Cookie')
      }
      if (
        field === 'musicU' &&
        (trimmed.startsWith('MUSIC_U=') || /[^\x21-\x7E]|[",;\\]/.test(trimmed))
      ) {
        throw new Error('请输入单独的 MUSIC_U 值')
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

  const next: PlatformSettingsData = {
    ...current,
    [platform]: storedRecord as PlatformSettingsData[K],
  }

  await writePlatformSettingsFile(next)
  return next
}
