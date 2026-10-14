import type { MusicSource } from '@/features/ost/types'

export const OST_SOURCES: MusicSource[] = ['khinsider', 'netease']

export const DEFAULT_OST_SOURCE: MusicSource = 'khinsider'

export const OST_SOURCE_LABEL: Record<MusicSource, string> = {
  khinsider: 'Khinsider',
  netease: '网易云音乐',
}

/** 搜索结果最多回传多少张专辑，避免工具结果与上下文过长 */
export const MAX_ALBUM_RESULTS = 8

/** 一次最多导入多少张专辑，避免模型一次调用写爆库 / 打爆上游 */
export const MAX_ALBUM_IMPORT = 10

/** 合并 albumId（单张）与 albumIds（多张）两种入参：去空、去重、保持顺序 */
export const collectAlbumRefs = (
  single?: string,
  many?: readonly string[] | undefined,
): string[] => {
  const refs: string[] = []
  const seen = new Set<string>()

  for (const raw of [single ?? '', ...(many ?? [])]) {
    const value = String(raw).trim()
    if (!value || seen.has(value)) {
      continue
    }
    seen.add(value)
    refs.push(value)
  }

  return refs
}

const KHINSIDER_ALBUM_PREFIX = 'https://downloads.khinsider.com/game-soundtracks/album/'

export type ResolveOstSourceResult =
  | { ok: true; source: MusicSource }
  | { ok: false; invalid: string }

/** 解析音源参数：留空时用默认音源，非法的原样带回给模型 */
export const resolveOstSource = (raw?: string): ResolveOstSourceResult => {
  const value = (raw ?? '').trim().toLowerCase()
  if (!value) {
    return { ok: true, source: DEFAULT_OST_SOURCE }
  }
  if (value === 'khinsider' || value === 'netease') {
    return { ok: true, source: value }
  }
  return { ok: false, invalid: value }
}

/** 规范化为接口可直接使用的专辑引用：netease 用数字 id，khinsider 用完整 URL */
export const normalizeAlbumRef = (source: MusicSource, raw: string): string => {
  const value = raw.trim()
  if (source === 'netease' || /^https?:\/\//i.test(value)) {
    return value
  }
  return `${KHINSIDER_ALBUM_PREFIX}${value.replace(/^\/+/, '')}`
}

/** 回传给模型、写进追问文案用的简短引用：netease 是数字 id，khinsider 是专辑页 slug */
export const toShortAlbumRef = (source: MusicSource, raw: string): string => {
  const value = raw.trim()
  if (source === 'netease') {
    return value
  }
  return value.split('/').filter(Boolean).pop() ?? value
}
