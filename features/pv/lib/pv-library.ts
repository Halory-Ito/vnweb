import type { PvManageItem, PvMetadata } from '@/types/pv'

const LEGACY_PV_CATEGORIES = new Map([
  ['op-ed', 'OP/ED'],
  ['trailer', '预告片'],
  ['character', '角色 PV'],
])

export function getPvCategoryName(category?: string) {
  const name = category?.trim() ?? ''
  if (name === 'uncategorized' || name === '未分类') return ''
  return LEGACY_PV_CATEGORIES.get(name) ?? name
}

export const PV_FILTERS = [
  { key: 'style', label: '风格' },
  { key: 'year', label: '年份' },
  { key: 'character', label: '角色' },
  { key: 'purpose', label: '用途' },
] as const

export const PV_LIBRARY_FILTERS = [...PV_FILTERS, { key: 'source', label: '来源' }] as const

export type PvCategoryFilter = string | null
export type PvFilterKey = (typeof PV_LIBRARY_FILTERS)[number]['key']
export type PvFilters = Record<PvFilterKey, string>

const EMPTY_PV_TAGS = { style: '', year: '', character: '', purpose: '' }

export const EMPTY_PV_FILTERS: PvFilters = { ...EMPTY_PV_TAGS, source: '' }

export const EMPTY_PV_METADATA: PvMetadata = {
  ...EMPTY_PV_TAGS,
  category: '',
  duration: null,
}

export function getPvCategoryLabel(category?: string) {
  return getPvCategoryName(category) || '未分类'
}

export function getPvCategories(items: PvManageItem[]) {
  const names = items.map((item) => getPvCategoryName(item.metadata?.category))
  return [...new Set(names.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, 'zh-CN'),
  )
}

const SOURCE_PLATFORMS = [
  {
    label: 'Steam',
    domains: [
      'steampowered.com',
      'steamcommunity.com',
      'steamstatic.com',
      'steamcdn-a.akamaihd.net',
    ],
  },
  { label: '哔哩哔哩', domains: ['bilibili.com', 'b23.tv', 'bilivideo.com', 'bilivideo.cn'] },
  {
    label: 'YouTube',
    domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com', 'googlevideo.com'],
  },
]

export function getPvSource(value: string) {
  const url = value.trim()
  if (url.startsWith('/assets/pv/')) return '本地视频'

  try {
    const { hostname, protocol } = new URL(url.startsWith('//') ? `https:${url}` : url)
    if (protocol !== 'http:' && protocol !== 'https:') return '未知来源'
    const platform = SOURCE_PLATFORMS.find(({ domains }) =>
      domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)),
    )
    return platform?.label ?? hostname.replace(/^www\./, '')
  } catch {
    return '未知来源'
  }
}

export function getPvFilterValue(item: PvManageItem, key: PvFilterKey) {
  return key === 'source' ? getPvSource(item.url) : item.metadata?.[key]
}

export function filterPvs(items: PvManageItem[], category: PvCategoryFilter, filters: PvFilters) {
  return items.filter(
    (item) =>
      (category === null || category === getPvCategoryName(item.metadata?.category)) &&
      PV_LIBRARY_FILTERS.every(
        ({ key }) => !filters[key] || getPvFilterValue(item, key) === filters[key],
      ),
  )
}

export function formatPvDuration(duration?: number | null) {
  if (!duration) return '时长未知'

  const seconds = Math.floor(duration % 60)
    .toString()
    .padStart(2, '0')
  const minutes = Math.floor(duration / 60)
  if (minutes < 60) return `${minutes}:${seconds}`

  return `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}:${seconds}`
}
