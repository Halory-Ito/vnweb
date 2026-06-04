import type {
  CharacterProviderPlugin,
  NormalizedCharacterRow,
} from '@/lib/plugins/types'

// ── Bangumi 响应类型 ──────────────────────────────────────

type BgmCharacterSubject = {
  id?: number
  name?: string
  name_cn?: string
  summary?: string
  images?: {
    large?: string
    common?: string
    medium?: string
    small?: string
    grid?: string
  }
}

type BgmCharacterInfoboxItem = {
  key?: string
  value?:
    | string
    | number
    | Array<{
        k?: string
        v?: string
      }>
}

type BgmCharacterDetail = {
  id?: number
  name?: string
  summary?: string
  gender?: string | null
  blood_type?: number | null
  birth_mon?: number | null
  birth_day?: number | null
  images?: {
    large?: string
    common?: string
    medium?: string
    small?: string
    grid?: string
  }
  infobox?: BgmCharacterInfoboxItem[]
}

type BgmSubjectCharacterResult = {
  id?: number
  name?: string
  relation?: string
  role_name?: string
  images?: {
    large?: string
    common?: string
    medium?: string
    small?: string
    grid?: string
  }
  character?: BgmCharacterSubject
}

// ── 工具函数 ──────────────────────────────────────────────

const toNullableIntFromUnknown = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : null
  }
  if (typeof value === 'string') {
    const num = Number(value.trim())
    return Number.isFinite(num) ? Math.trunc(num) : null
  }
  return null
}

const normalizeInfoboxValue = (value: BgmCharacterInfoboxItem['value']) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => item?.v || '')
      .filter(Boolean)
      .join('/')
  }
  return ''
}

const extractNumberFromText = (value: string) => {
  const matched = value.match(/-?\d+(?:\.\d+)?/)
  if (!matched?.[0]) {
    return null
  }
  const num = Number(matched[0])
  return Number.isFinite(num) ? Math.trunc(num) : null
}

const parseBwhValue = (value: string) => {
  const result: {
    bust: number | null
    waist: number | null
    hips: number | null
  } = {
    bust: null,
    waist: null,
    hips: null,
  }

  const compact = value.replace(/\s+/g, '')
  const tagged = Array.from(
    compact.matchAll(/([BWHbwh])[：:]*([0-9]+(?:\.[0-9]+)?)/g),
  )
  if (tagged.length > 0) {
    for (const part of tagged) {
      const label = (part[1] || '').toUpperCase()
      const num = toNullableIntFromUnknown(part[2])
      if (label === 'B') {
        result.bust = num
      }
      if (label === 'W') {
        result.waist = num
      }
      if (label === 'H') {
        result.hips = num
      }
    }
    return result
  }

  const series = Array.from(compact.matchAll(/\d+(?:\.\d+)?/g)).map((part) =>
    toNullableIntFromUnknown(part[0]),
  )

  if (series.length >= 3) {
    result.bust = series[0] ?? null
    result.waist = series[1] ?? null
    result.hips = series[2] ?? null
  } else if (series.length === 1) {
    result.bust = series[0] ?? null
  }

  return result
}

const serializeTuple = (
  value: [string | null, string | null] | null | undefined,
) => {
  if (!value) {
    return ''
  }
  return JSON.stringify(value)
}

const mapBangumiGenderToTuple = (value: string | null | undefined) => {
  const normalized = (value || '').trim().toLowerCase()
  if (!normalized) {
    return ''
  }

  const map: Record<string, 'm' | 'f' | 'b' | 'n'> = {
    male: 'm',
    man: 'm',
    m: 'm',
    男: 'm',
    female: 'f',
    woman: 'f',
    f: 'f',
    女: 'f',
    both: 'b',
    intersex: 'b',
    b: 'b',
    none: 'n',
    unknown: 'n',
    n: 'n',
  }

  const mapped = map[normalized]
  if (!mapped) {
    return ''
  }

  return serializeTuple([mapped, mapped])
}

const mapBangumiBloodType = (value: number | null | undefined) => {
  if (value === 1) return 'A'
  if (value === 2) return 'B'
  if (value === 3) return 'AB'
  if (value === 4) return 'O'
  return ''
}

const mapBangumiBloodTypeFromText = (value: string) => {
  const normalized = value.trim().toUpperCase()
  if (
    normalized === 'A' ||
    normalized === 'B' ||
    normalized === 'AB' ||
    normalized === 'O'
  ) {
    return normalized
  }
  return ''
}

const pickBgmImageUrl = (
  images:
    | {
        large?: string
        common?: string
        medium?: string
        small?: string
        grid?: string
      }
    | undefined,
) => {
  if (!images) {
    return ''
  }
  return (
    images.large ||
    images.common ||
    images.medium ||
    images.small ||
    images.grid ||
    ''
  )
}

const pickBangumiNameFromInfobox = (
  infobox: BgmCharacterInfoboxItem[] | undefined,
) => {
  if (!Array.isArray(infobox)) {
    return ''
  }

  const match = infobox.find(
    (item) => (item.key || '').trim().toLowerCase() === '简体中文名',
  )
  return normalizeInfoboxValue(match?.value).trim()
}

const sanitizeFileNamePart = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

const mapBangumiDetailToCharacterFields = (detail: BgmCharacterDetail) => {
  const infobox = detail.infobox
  let height: number | null = null
  let weight: number | null = null
  let bust: number | null = null
  let waist: number | null = null
  let hips: number | null = null
  let infoboxGender = ''
  let infoboxBloodType = ''

  if (Array.isArray(infobox)) {
    for (const item of infobox) {
      const key = (item.key || '').trim().toLowerCase()
      const value = normalizeInfoboxValue(item.value)
      if (!value) {
        continue
      }

      if (key === '身高') {
        height = extractNumberFromText(value)
      }

      if (key === '体重') {
        weight = extractNumberFromText(value)
      }

      if (key === 'bwh' || key === '三围') {
        const bwh = parseBwhValue(value)
        bust = bwh.bust
        waist = bwh.waist
        hips = bwh.hips
      }

      if (key === '性别') {
        infoboxGender = value
      }

      if (key === '血型') {
        infoboxBloodType = value
      }
    }
  }

  const mappedGenderTuple =
    mapBangumiGenderToTuple(detail.gender) ||
    mapBangumiGenderToTuple(infoboxGender)
  const mappedBloodType =
    mapBangumiBloodType(detail.blood_type) ||
    mapBangumiBloodTypeFromText(infoboxBloodType)

  return {
    name: pickBangumiNameFromInfobox(infobox),
    original: detail.name || '',
    description: detail.summary || '',
    imageUrl: pickBgmImageUrl(detail.images),
    bloodType: mappedBloodType,
    birthdayMonth: toNullableIntFromUnknown(detail.birth_mon),
    birthdayDay: toNullableIntFromUnknown(detail.birth_day),
    height,
    weight,
    bust,
    waist,
    hips,
    sex: mappedGenderTuple,
    gender: mappedGenderTuple,
  }
}

// ── 插件实现 ──────────────────────────────────────────────

export const bangumiCharacterProvider: CharacterProviderPlugin = {
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

  async resolveExternalId(gameId: number): Promise<string | null> {
    const { eq } = await import('drizzle-orm')
    const { GameIdMapTable } = await import('@/db/schema')
    const { db } = await import('@/lib/drizzle')

    const idMaps = await db
      .select({
        provider: GameIdMapTable.provider,
        externalId: GameIdMapTable.externalId,
      })
      .from(GameIdMapTable)
      .where(eq(GameIdMapTable.gameId, gameId))

    const binding = idMaps.find(
      (item) => item.provider.trim().toLowerCase() === 'bangumi',
    )

    if (!binding) {
      return null
    }

    const normalized = this.normalizeExternalId(binding.externalId)
    return normalized || null
  },

  async fetchCharacters(ctx): Promise<NormalizedCharacterRow[]> {
    const { gameId, externalId: bgmSubjectId, saveImagesToLocal, now } = ctx

    const { BGMClient } = await import('@/lib/vndb-client')
    const { localizeCharacterImage } = await import('./utils')

    const res = await BGMClient.request({
      method: 'GET',
      url: `/v0/subjects/${bgmSubjectId}/characters`,
    })

    const payloadData = res.data as BgmSubjectCharacterResult[]
    const rows = payloadData ?? []

    return Promise.all(
      rows.map(async (item, index) => {
        const character = item.character
        const bgmCharacterId = character?.id ?? item.id ?? index + 1
        const fallbackId = sanitizeFileNamePart(
          [character?.name, character?.name_cn, item.name]
            .filter(Boolean)
            .join('_'),
        )
        const rowId = `bgm-${bgmCharacterId || fallbackId || index + 1}`

        let detailMapped: ReturnType<
          typeof mapBangumiDetailToCharacterFields
        > | null = null
        if (
          typeof bgmCharacterId === 'number' &&
          Number.isFinite(bgmCharacterId)
        ) {
          try {
            const detailRes = await BGMClient.request({
              method: 'GET',
              url: `/v0/characters/${bgmCharacterId}`,
            })
            detailMapped = mapBangumiDetailToCharacterFields(
              detailRes.data as BgmCharacterDetail,
            )
          } catch (error) {
            console.warn('Fetch Bangumi character detail failed:', {
              gameId,
              bgmSubjectId,
              bgmCharacterId,
              error,
            })
          }
        }

        const imageUrl =
          detailMapped?.imageUrl ||
          pickBgmImageUrl(character?.images) ||
          pickBgmImageUrl(item.images)
        let finalImageUrl = imageUrl

        if (saveImagesToLocal && imageUrl) {
          try {
            finalImageUrl = await localizeCharacterImage(
              gameId,
              rowId,
              imageUrl,
            )
          } catch (error) {
            console.error('Localize Bangumi character image failed:', error)
            finalImageUrl = imageUrl
          }
        }

        return {
          gameId,
          vndbId: rowId,
          name: detailMapped?.name || character?.name_cn || item.name || '',
          original: detailMapped?.original || character?.name || '',
          description:
            detailMapped?.description || character?.summary || '',
          imageUrl: finalImageUrl,
          bloodType: detailMapped?.bloodType || '',
          height: detailMapped?.height ?? null,
          weight: detailMapped?.weight ?? null,
          bust: detailMapped?.bust ?? null,
          waist: detailMapped?.waist ?? null,
          hips: detailMapped?.hips ?? null,
          age: null,
          birthdayMonth: detailMapped?.birthdayMonth ?? null,
          birthdayDay: detailMapped?.birthdayDay ?? null,
          sex: detailMapped?.sex || '',
          gender: detailMapped?.gender || '',
          createdAt: now,
          updatedAt: now,
        } as NormalizedCharacterRow
      }),
    )
  },
}
