import { api } from '@/lib/request-utils'
import type {
  CharacterProviderPlugin,
  NormalizedCharacterRow,
} from '@/lib/plugins/types'

// ── YMGal 响应类型 ────────────────────────────────────────

type YMGalCharacterRelation = {
  cid: number
  cvId?: number
  characterPosition?: number
}

type YMGalCharacterDetail = {
  cid: number
  name: string
  chineseName?: string
  extensionName?: Array<{ name?: string; type?: string; desc?: string }>
  introduction?: string
  mainImg?: string
  gender?: number
  birthday?: string
}

type YMGalGameDetailResponse = {
  success: boolean
  code: number
  data?: {
    game?: {
      characters?: YMGalCharacterRelation[]
    }
    cidMapping?: Record<
      string,
      {
        cid: number
        name: string
        mainImg?: string
      }
    >
  }
}

type YMGalCharacterDetailResponse = {
  success: boolean
  code: number
  data?: {
    character?: YMGalCharacterDetail
  }
}

// ── YMGal 请求头 ──────────────────────────────────────────

const YMGAL_HEADERS = {
  'Access-Yuemoon-Origin': 'pc',
  Origin: 'https://f.ymgal.games',
  Referer: 'https://f.ymgal.games/',
}

// ── Token 管理 ────────────────────────────────────────────

let cachedToken: string | null = null
let tokenExpiresAt = 0

const getToken = async (): Promise<string> => {
  const now = Date.now()
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken
  }

  const { YMGAL_BASE_URL, YMGAL_CLIENT_ID, YMGAL_CLIENT_SECRET } =
    await import('@/app/config')

  const res = await api.post(`${YMGAL_BASE_URL}/oauth/token`, new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: YMGAL_CLIENT_ID,
    client_secret: YMGAL_CLIENT_SECRET,
    scope: 'public',
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...YMGAL_HEADERS,
    },
  })

  const data = res.data as {
    access_token?: string
    expires_in?: number
  }

  if (!data.access_token) {
    throw new Error('YMGal: 获取 access token 失败')
  }

  cachedToken = data.access_token
  tokenExpiresAt = now + (data.expires_in ?? 3600) * 1000 - 60_000
  return cachedToken
}

const ymgalOpenRequest = async <T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T> => {
  const { YMGAL_BASE_URL } = await import('@/app/config')
  const token = await getToken()

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    query.set(key, String(value))
  }

  const res = await api.get(`${YMGAL_BASE_URL}${path}`, {
    params: Object.fromEntries(query),
    headers: {
      Accept: 'application/json;charset=utf-8',
      Authorization: `Bearer ${token}`,
      version: '1',
      ...YMGAL_HEADERS,
    },
  })

  return res.data as T
}

// ── 工具函数 ──────────────────────────────────────────────

const mapGenderEnum = (gender: number | undefined): string => {
  if (gender === 1) return JSON.stringify(['m', 'm'])
  if (gender === 2) return JSON.stringify(['f', 'f'])
  if (gender === 3) return JSON.stringify(['b', 'b'])
  return ''
}

const parseBirthday = (
  birthday: string | undefined,
): { month: number | null; day: number | null } => {
  if (!birthday) return { month: null, day: null }
  const parts = birthday.split('-')
  if (parts.length < 3) return { month: null, day: null }
  const month = Number(parts[1])
  const day = Number(parts[2])
  return {
    month: Number.isFinite(month) ? month : null,
    day: Number.isFinite(day) ? day : null,
  }
}

// ── 插件实现 ──────────────────────────────────────────────

export const ymgalCharacterProvider: CharacterProviderPlugin = {
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
      (item) => item.provider.trim().toLowerCase() === 'ymgal',
    )

    if (!binding) return null

    const normalized = this.normalizeExternalId(binding.externalId)
    return normalized || null
  },

  async fetchCharacters(ctx): Promise<NormalizedCharacterRow[]> {
    const { gameId, externalId: gid, saveImagesToLocal, now } = ctx
    const { localizeCharacterImage } = await import('./utils')

    // 1. 获取游戏详情，拿到角色列表
    let gameRes: YMGalGameDetailResponse
    try {
      gameRes = await ymgalOpenRequest<YMGalGameDetailResponse>(
        '/open/archive',
        { gid, type: 'game' },
      )
    } catch (error) {
      console.error('YMGal: 获取游戏详情失败', { gameId, gid, error })
      return []
    }

    if (!gameRes.success || !gameRes.data?.game?.characters?.length) {
      return []
    }

    const characterRelations = gameRes.data.game.characters
    const cidMapping = gameRes.data.cidMapping ?? {}

    // 2. 逐个获取角色详情
    const rows = await Promise.all(
      characterRelations.map(async (relation) => {
        const { cid } = relation
        const basicInfo = cidMapping[String(cid)]

        // 获取角色详情
        let detail: YMGalCharacterDetail | undefined
        try {
          const charRes =
            await ymgalOpenRequest<YMGalCharacterDetailResponse>(
              '/open/archive',
              { cid, type: 'character' },
            )
          detail = charRes.data?.character
        } catch (error) {
          console.warn('YMGal: 获取角色详情失败', { gameId, cid, error })
        }

        // 构建角色数据
        const name =
          detail?.chineseName || detail?.name || basicInfo?.name || ''
        const original = detail?.name || basicInfo?.name || ''
        const description = detail?.introduction || ''
        const imageUrl = detail?.mainImg || basicInfo?.mainImg || ''
        const gender = mapGenderEnum(detail?.gender)
        const birthday = parseBirthday(detail?.birthday)

        // 图片本地化（带 YMGal 请求头）
        let finalImageUrl = imageUrl
        if (saveImagesToLocal && imageUrl) {
          try {
            finalImageUrl = await localizeCharacterImage(
              gameId,
              `ymgal-${cid}`,
              imageUrl,
              YMGAL_HEADERS,
            )
          } catch (error) {
            console.error('YMGal: 本地化角色图片失败', error)
          }
        }

        return {
          gameId,
          vndbId: `ymgal-${cid}`,
          name,
          original,
          description,
          imageUrl: finalImageUrl,
          bloodType: '',
          height: null,
          weight: null,
          bust: null,
          waist: null,
          hips: null,
          age: null,
          birthdayMonth: birthday.month,
          birthdayDay: birthday.day,
          sex: gender,
          gender,
          createdAt: now,
          updatedAt: now,
        } as NormalizedCharacterRow
      }),
    )

    return rows
  },
}
