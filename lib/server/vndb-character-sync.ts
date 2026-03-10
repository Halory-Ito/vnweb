import { AxiosError } from 'axios'
import dayjs from 'dayjs'
import { and, eq } from 'drizzle-orm'
import fs from 'node:fs/promises'
import path from 'node:path'

import { CharacterTable, GameIdMapTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { VNDBClient } from '@/lib/vndb-client'

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

const normalizeVnId = (rawId: string) => {
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
}

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

const sanitizeFileNamePart = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

const isRemoteImageUrl = (value: string) => /^https?:\/\//i.test(value)

const pickImageExt = (url: string, contentType: string | null) => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/svg+xml': 'svg',
  }

  const contentKey = contentType?.split(';')[0].trim().toLowerCase() || ''
  if (contentKey && map[contentKey]) {
    return map[contentKey]
  }

  try {
    const parsed = new URL(url)
    const ext = path.extname(parsed.pathname).replace('.', '').toLowerCase()
    if (ext && /^[a-z0-9]+$/.test(ext)) {
      return ext
    }
  } catch {
    // ignore
  }

  return 'jpg'
}

const localizeCharacterImage = async (
  gameId: number,
  characterId: string,
  sourceUrl: string,
) => {
  const normalized = sourceUrl.trim()
  if (!normalized) {
    return ''
  }

  if (!isRemoteImageUrl(normalized)) {
    return normalized
  }

  const response = await fetch(normalized)
  if (!response.ok) {
    throw new Error(`下载角色图片失败: ${response.status}`)
  }

  const ext = pickImageExt(normalized, response.headers.get('content-type'))
  const safeCharacterId = sanitizeFileNamePart(characterId) || 'character'
  const fileName = `${safeCharacterId}.${ext}`

  const publicDir = path.join(
    process.cwd(),
    'public',
    'assets',
    'characters',
    String(gameId),
  )

  await fs.mkdir(publicDir, { recursive: true })

  const filePath = path.join(publicDir, fileName)
  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  return `/assets/characters/${gameId}/${fileName}`
}

const resolveVnIdByGameId = async (gameId: number) => {
  const idMaps = await db
    .select({
      provider: GameIdMapTable.provider,
      externalId: GameIdMapTable.externalId,
    })
    .from(GameIdMapTable)
    .where(eq(GameIdMapTable.gameId, gameId))

  const vndbBinding = idMaps.find(
    (item) => item.provider.trim().toLowerCase() === 'vndb',
  )

  if (!vndbBinding) {
    return ''
  }

  return normalizeVnId(vndbBinding.externalId)
}

export const syncVndbCharactersByGameId = async (gameId: number) => {
  const vnId = await resolveVnIdByGameId(gameId)
  if (!vnId) {
    return {
      gameId,
      vnId: '',
      total: 0,
      inserted: 0,
      updated: 0,
    }
  }

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
    const axiosError = error as AxiosError
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

  const now = dayjs().toISOString()

  const rows = await Promise.all(
    rawRows.map(async (item) => {
      const imageUrl = item.image?.url ?? ''
      let localizedImageUrl = ''

      if (imageUrl) {
        try {
          localizedImageUrl = await localizeCharacterImage(
            gameId,
            item.id ?? '',
            imageUrl,
          )
        } catch (error) {
          console.error('Localize VNDB character image failed:', error)
          localizedImageUrl = imageUrl
        }
      }

      return {
        gameId,
        vndbId: item.id ?? '',
        name: item.name ?? '',
        original: item.original ?? '',
        description: item.description ?? '',
        imageUrl: localizedImageUrl,
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
      }
    }),
  )

  if (!rows.length) {
    return {
      gameId,
      vnId,
      total: 0,
      inserted: 0,
      updated: 0,
    }
  }

  const existing = await db
    .select({ vndbId: CharacterTable.vndbId })
    .from(CharacterTable)
    .where(eq(CharacterTable.gameId, gameId))

  const existingIds = new Set(existing.map((item) => item.vndbId))

  const insertRows = rows.filter((item) => !existingIds.has(item.vndbId))
  const updateRows = rows.filter((item) => existingIds.has(item.vndbId))

  await db.transaction(async (tx) => {
    if (insertRows.length > 0) {
      await tx.insert(CharacterTable).values(insertRows)
    }

    for (const row of updateRows) {
      await tx
        .update(CharacterTable)
        .set({
          name: row.name,
          original: row.original,
          description: row.description,
          imageUrl: row.imageUrl,
          bloodType: row.bloodType,
          height: row.height,
          weight: row.weight,
          bust: row.bust,
          waist: row.waist,
          hips: row.hips,
          age: row.age,
          birthdayMonth: row.birthdayMonth,
          birthdayDay: row.birthdayDay,
          sex: row.sex,
          gender: row.gender,
          updatedAt: now,
        })
        .where(
          and(
            eq(CharacterTable.gameId, gameId),
            eq(CharacterTable.vndbId, row.vndbId),
          ),
        )
    }
  })

  return {
    gameId,
    vnId,
    total: rows.length,
    inserted: insertRows.length,
    updated: updateRows.length,
  }
}
