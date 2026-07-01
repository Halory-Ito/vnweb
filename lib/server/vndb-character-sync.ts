import dayjs from 'dayjs'
import { and, eq } from 'drizzle-orm'

import { CharacterTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { getCharacterProvider } from '@/lib/plugins/registry'

import type { NormalizedCharacterRow } from '@/lib/plugins/types'

export type { NormalizedCharacterRow }

export type CharacterSource = string

// ── 合并策略工具 ──────────────────────────────────────────

const normalizeNameKey = (value: string) =>
  value
    .toLocaleLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '')
    .trim()

const isBlank = (value: string | null | undefined) => !value || !value.trim()

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

// ── 多源合并 ──────────────────────────────────────────────

type CharacterMergeStrategy =
  | 'prefer_vndb'
  | 'prefer_bangumi'
  | 'prefer_bangumi_with_vndb_fallback'

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

// ── 主同步函数 ────────────────────────────────────────────

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

  const now = dayjs().toISOString()

  // 'both' 模式：合并 vndb + bangumi（向后兼容）
  if (source === 'both') {
    const vndbProvider = getCharacterProvider('vndb')
    const bangumiProvider = getCharacterProvider('bangumi')

    const vnId = vndbProvider
      ? ((await vndbProvider.resolveExternalId(gameId)) ?? '')
      : ''
    const bgmSubjectId = bangumiProvider
      ? ((await bangumiProvider.resolveExternalId(gameId)) ?? '')
      : ''

    if (!vnId && !bgmSubjectId) {
      return {
        gameId,
        vnId: '',
        bgmSubjectId: '',
        total: 0,
        inserted: 0,
        updated: 0,
      }
    }

    const vndbRows =
      vndbProvider && vnId
        ? await vndbProvider.fetchCharacters({
            gameId,
            externalId: vnId,
            saveImagesToLocal,
            now,
          })
        : []
    const bgmRows =
      bangumiProvider && bgmSubjectId
        ? await bangumiProvider.fetchCharacters({
            gameId,
            externalId: bgmSubjectId,
            saveImagesToLocal,
            now,
          })
        : []

    const rows = mergeCharacterRows(vndbRows, bgmRows, mergeStrategy)
    const result = await upsertCharacters(gameId, rows, now)
    return { gameId, vnId, bgmSubjectId, ...result }
  }

  // 单源模式：通过插件注册表动态查找
  const provider = getCharacterProvider(source)
  if (!provider) {
    return {
      gameId,
      vnId: '',
      bgmSubjectId: '',
      total: 0,
      inserted: 0,
      updated: 0,
    }
  }

  const externalId = (await provider.resolveExternalId(gameId)) ?? ''
  if (!externalId) {
    return {
      gameId,
      vnId: '',
      bgmSubjectId: '',
      total: 0,
      inserted: 0,
      updated: 0,
    }
  }

  const rows = await provider.fetchCharacters({
    gameId,
    externalId,
    saveImagesToLocal,
    now,
  })
  const result = await upsertCharacters(gameId, rows, now)

  // 兼容返回格式：根据 source 填充 vnId 或 bgmSubjectId
  return {
    gameId,
    vnId: source === 'vndb' ? externalId : '',
    bgmSubjectId: source === 'bangumi' ? externalId : '',
    ...result,
  }
}

// ── 数据库写入 ────────────────────────────────────────────

const upsertCharacters = async (
  gameId: number,
  rows: NormalizedCharacterRow[],
  now: string,
) => {
  if (!rows.length) {
    return { total: 0, inserted: 0, updated: 0 }
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
    total: rows.length,
    inserted: insertRows.length,
    updated: updateRows.length,
  }
}
