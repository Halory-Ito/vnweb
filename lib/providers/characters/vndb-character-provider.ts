import type {
  CharacterProviderPlugin,
  NormalizedCharacterRow,
} from '@/lib/plugins/types'

// ── VNDB 响应类型 ─────────────────────────────────────────

type VndbCharacterResult = {
  id?: string
  name?: string
  original?: string | null
  description?: string | null
  blood_type?: string | null
  height?: number | null
  weight?: number | null
  bust?: number | null
  waist?: number | null
  hips?: number | null
  age?: number | null
  birthday?: [number, number] | null
  sex?: [string | null, string | null] | null
  gender?: [string | null, string | null] | null
  image?: {
    url?: string
  } | null
}

// ── 工具函数 ──────────────────────────────────────────────

const toNullableInteger = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }
  return Math.trunc(value)
}

const serializeTuple = (
  value: [string | null, string | null] | null | undefined,
) => {
  if (!value) {
    return ''
  }
  return JSON.stringify(value)
}

// ── 插件实现 ──────────────────────────────────────────────

export const vndbCharacterProvider: CharacterProviderPlugin = {
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
      (item) => item.provider.trim().toLowerCase() === 'vndb',
    )

    if (!binding) {
      return null
    }

    const normalized = this.normalizeExternalId(binding.externalId)
    return normalized || null
  },

  async fetchCharacters(ctx): Promise<NormalizedCharacterRow[]> {
    const { gameId, externalId: vnId, saveImagesToLocal, now } = ctx

    const { AxiosError } = await import('axios')
    const { VNDBClient } = await import('@/lib/vndb-client')
    const { localizeCharacterImage } = await import('./utils')

    let res
    try {
      res = await VNDBClient.request({
        method: 'POST',
        url: '/character',
        data: {
          filters: ['vn', '=', ['id', '=', vnId]],
          fields:
            'id, name, original, description, image.url, blood_type, height, weight, bust, waist, hips, age, birthday, sex, gender',
          sort: 'name',
          results: 100,
        },
      })
    } catch (error) {
      const axiosError = error as InstanceType<typeof AxiosError>
      console.error('VNDB sync request failed:', {
        gameId,
        vnId,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      })
      throw error
    }

    const payloadData = res.data as {
      results?: VndbCharacterResult[]
    }

    const rawRows = (payloadData.results ?? []).filter(
      (item) => item.id && (item.name || item.original),
    )

    return Promise.all(
      rawRows.map(async (item) => {
        const imageUrl = item.image?.url ?? ''
        let finalImageUrl = imageUrl

        if (saveImagesToLocal && imageUrl) {
          try {
            finalImageUrl = await localizeCharacterImage(
              gameId,
              item.id ?? '',
              imageUrl,
            )
          } catch (error) {
            console.error('Localize VNDB character image failed:', error)
            finalImageUrl = imageUrl
          }
        }

        return {
          gameId,
          vndbId: item.id ?? '',
          name: item.name ?? '',
          original: item.original ?? '',
          description: item.description ?? '',
          imageUrl: finalImageUrl,
          bloodType: item.blood_type ?? '',
          height: toNullableInteger(item.height),
          weight: toNullableInteger(item.weight),
          bust: toNullableInteger(item.bust),
          waist: toNullableInteger(item.waist),
          hips: toNullableInteger(item.hips),
          age: toNullableInteger(item.age),
          birthdayMonth: toNullableInteger(item.birthday?.[0]),
          birthdayDay: toNullableInteger(item.birthday?.[1]),
          sex: serializeTuple(item.sex),
          gender: serializeTuple(item.gender),
          createdAt: now,
          updatedAt: now,
        } as NormalizedCharacterRow
      }),
    )
  },
}
