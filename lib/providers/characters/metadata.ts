import type { CharacterProvider } from '../types'

type CharacterProviderInfo = Omit<CharacterProvider, 'resolveExternalId' | 'fetchCharacters'>

export const vndbCharacterProviderInfo: CharacterProviderInfo = {
  id: 'vndb-character',
  name: 'VNDB 角色',
  description: '从 VNDB 获取视觉小说角色数据',
  version: '1.0.0',
  icon: 'BookOpen',
  type: 'character-provider',
  defaultEnabled: true,
  sourceId: 'vndb',

  normalizeExternalId(rawId: string): string {
    const trimmed = rawId.trim()
    if (!trimmed) {
      return ''
    }
    if (/^v\d+$/i.test(trimmed)) {
      return `v${trimmed.slice(1)}`
    }
    if (/^\d+$/.test(trimmed)) {
      return `v${trimmed}`
    }
    return ''
  },
}

export const bangumiCharacterProviderInfo: CharacterProviderInfo = {
  id: 'bangumi-character',
  name: 'Bangumi 角色',
  description: '从 Bangumi 获取动画/游戏角色数据',
  version: '1.0.0',
  icon: 'Tv',
  type: 'character-provider',
  defaultEnabled: true,
  sourceId: 'bangumi',

  normalizeExternalId(rawId: string): string {
    const trimmed = rawId.trim()
    if (!trimmed) {
      return ''
    }

    const subjectMatch = trimmed.match(/subject\/(\d+)/i)
    if (subjectMatch?.[1]) {
      return subjectMatch[1]
    }

    if (/^\d+$/.test(trimmed)) {
      return trimmed
    }

    return ''
  },
}

export const ymgalCharacterProviderInfo: CharacterProviderInfo = {
  id: 'ymgal-character',
  name: 'YMGal 角色',
  description: '从 YMGal 获取 Galgame 角色数据',
  version: '1.0.0',
  icon: 'Moon',
  type: 'character-provider',
  defaultEnabled: true,
  sourceId: 'ymgal',

  normalizeExternalId(rawId: string): string {
    const trimmed = rawId.trim()
    if (!trimmed) return ''

    // 支持 ga35200 或 35200 格式
    const gaMatch = trimmed.match(/^ga(\d+)$/i)
    if (gaMatch?.[1]) return gaMatch[1]

    if (/^\d+$/.test(trimmed)) return trimmed

    return ''
  },
}
