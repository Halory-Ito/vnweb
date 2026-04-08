import { AxiosError } from 'axios'
import dayjs from 'dayjs'
import { and, eq } from 'drizzle-orm'
import fs from 'node:fs/promises'
import path from 'node:path'

import { CharacterTable, GameIdMapTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { BGMClient, VNDBClient } from '@/lib/vndb-client'

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

type CharacterSource = 'vndb' | 'bangumi' | 'both'
type CharacterMergeStrategy =
  | 'prefer_vndb'
  | 'prefer_bangumi'
  | 'prefer_bangumi_with_vndb_fallback'

type NormalizedCharacterRow = {
  gameId: number
  vndbId: string
  name: string
  original: string
  description: string
  imageUrl: string
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
  createdAt: string
  updatedAt: string
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

const normalizeBgmSubjectId = (rawId: string) => {
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

const normalizeNameKey = (value: string) =>
  value
    .toLocaleLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '')
    .trim()

const isBlank = (value: string | null | undefined) => !value || !value.trim()

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

const toNameKeys = (name: string, original: string) => {
  const keys = new Set<string>()
  const normalizedName = normalizeNameKey(name)
  const normalizedOriginal = normalizeNameKey(original)

  if (normalizedName) {
    keys.add(normalizedName)
  }

  if (normalizedOriginal) {
    keys.add(normalizedOriginal)
  }

  return Array.from(keys)
}

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
  if (value === 1) {
    return 'A'
  }
  if (value === 2) {
    return 'B'
  }
  if (value === 3) {
    return 'AB'
  }
  if (value === 4) {
    return 'O'
  }
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

const resolveProviderIdByGameId = async (
  gameId: number,
  provider: 'vndb' | 'bangumi',
) => {
  const idMaps = await db
    .select({
      provider: GameIdMapTable.provider,
      externalId: GameIdMapTable.externalId,
    })
    .from(GameIdMapTable)
    .where(eq(GameIdMapTable.gameId, gameId))

  const binding = idMaps.find(
    (item) => item.provider.trim().toLowerCase() === provider,
  )

  if (!binding) {
    return ''
  }

  return provider === 'vndb'
    ? normalizeVnId(binding.externalId)
    : normalizeBgmSubjectId(binding.externalId)
}

const fetchVndbCharacters = async (
  gameId: number,
  vnId: string,
  now: string,
  saveImagesToLocal: boolean,
) => {
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
}

const fetchBangumiCharacters = async (
  gameId: number,
  bgmSubjectId: string,
  now: string,
  saveImagesToLocal: boolean,
) => {
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
          finalImageUrl = await localizeCharacterImage(gameId, rowId, imageUrl)
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
        description: detailMapped?.description || character?.summary || '',
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
}

const mergeCharacterRows = (
  vndbRows: NormalizedCharacterRow[],
  bgmRows: NormalizedCharacterRow[],
  strategy: CharacterMergeStrategy,
) => {
  if (!bgmRows.length) {
    return vndbRows
  }

  if (!vndbRows.length) {
    return bgmRows
  }

  const vndbByName = new Map<string, NormalizedCharacterRow>()
  const bgmByName = new Map<string, NormalizedCharacterRow>()

  for (const row of vndbRows) {
    for (const key of toNameKeys(row.name, row.original)) {
      if (!vndbByName.has(key)) {
        vndbByName.set(key, row)
      }
    }
  }

  for (const row of bgmRows) {
    for (const key of toNameKeys(row.name, row.original)) {
      if (!bgmByName.has(key)) {
        bgmByName.set(key, row)
      }
    }
  }

  if (strategy === 'prefer_vndb') {
    const merged = [...vndbRows]
    const used = new Set(merged.map((item) => item.vndbId))
    for (const row of bgmRows) {
      const hasMatch = toNameKeys(row.name, row.original).some((key) =>
        vndbByName.has(key),
      )
      if (!hasMatch && !used.has(row.vndbId)) {
        merged.push(row)
        used.add(row.vndbId)
      }
    }
    return merged
  }

  const result = new Map<string, NormalizedCharacterRow>()

  for (const bgmRow of bgmRows) {
    const matchedVndb = toNameKeys(bgmRow.name, bgmRow.original)
      .map((key) => vndbByName.get(key))
      .find(Boolean)

    if (matchedVndb && strategy === 'prefer_bangumi_with_vndb_fallback') {
      result.set(bgmRow.vndbId, {
        ...matchedVndb,
        ...bgmRow,
        name: isBlank(bgmRow.name) ? matchedVndb.name : bgmRow.name,
        original: isBlank(bgmRow.original)
          ? matchedVndb.original
          : bgmRow.original,
        description: isBlank(bgmRow.description)
          ? matchedVndb.description
          : bgmRow.description,
        imageUrl: isBlank(bgmRow.imageUrl)
          ? matchedVndb.imageUrl
          : bgmRow.imageUrl,
      })
      continue
    }

    result.set(bgmRow.vndbId, bgmRow)
  }

  for (const vndbRow of vndbRows) {
    const hasMatch = toNameKeys(vndbRow.name, vndbRow.original).some((key) =>
      bgmByName.has(key),
    )
    if (!hasMatch) {
      result.set(vndbRow.vndbId, vndbRow)
    }
  }

  return Array.from(result.values())
}

export const syncVndbCharactersByGameId = async (
  gameId: number,
  options?: {
    source?: CharacterSource
    mergeStrategy?: CharacterMergeStrategy
    saveImagesToLocal?: boolean
  },
) => {
  const source = options?.source ?? 'vndb'
  const mergeStrategy =
    options?.mergeStrategy ?? 'prefer_bangumi_with_vndb_fallback'
  const saveImagesToLocal = options?.saveImagesToLocal ?? true

  const vnId = await resolveProviderIdByGameId(gameId, 'vndb')
  const bgmSubjectId = await resolveProviderIdByGameId(gameId, 'bangumi')

  const needVndb =
    source === 'vndb' ||
    source === 'both' ||
    mergeStrategy === 'prefer_bangumi_with_vndb_fallback' ||
    mergeStrategy === 'prefer_vndb'
  const needBangumi = source === 'bangumi' || source === 'both'

  if ((!needVndb || !vnId) && (!needBangumi || !bgmSubjectId)) {
    return {
      gameId,
      vnId: '',
      bgmSubjectId: '',
      total: 0,
      inserted: 0,
      updated: 0,
    }
  }

  const now = dayjs().toISOString()

  const vndbRows =
    needVndb && vnId
      ? await fetchVndbCharacters(gameId, vnId, now, saveImagesToLocal)
      : []
  const bgmRows =
    needBangumi && bgmSubjectId
      ? await fetchBangumiCharacters(
          gameId,
          bgmSubjectId,
          now,
          saveImagesToLocal,
        )
      : []

  const rows = mergeCharacterRows(vndbRows, bgmRows, mergeStrategy)

  if (!rows.length) {
    return {
      gameId,
      vnId,
      bgmSubjectId,
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
    bgmSubjectId,
    total: rows.length,
    inserted: insertRows.length,
    updated: updateRows.length,
  }
}
