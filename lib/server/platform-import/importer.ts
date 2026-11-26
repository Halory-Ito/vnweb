import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

import {
  dedupeStringList,
  normalizeExternalIdPair,
  normalizeLooseNameForMatch,
  normalizeNameForMatch,
} from './types'
import {
  CharacterTable,
  CollectionGameTable,
  CollectionTable,
  GameIdMapTable,
  GameInfoTable,
  GameMemoryTable,
  GamePlayTable,
  GameRecordTable,
  GameStatusTable,
  relateWebsiteTable,
} from '@/db/schema'
import { gamePlayStatusLabelMap } from '@/features/game/lib/game-status'
import { db } from '@/lib/drizzle'
import { localizeCharacterImage } from '@/lib/providers/characters/utils'
import { ensureGameCompletionSchema, resolveCompletedAt } from '@/lib/server/game-completion'
import { localizeGameImage } from '@/lib/server/game-image-storage'
import { getLatestTimerEndAt } from '@/lib/server/game-last-run'
import { ensureGameStatusSchema } from '@/lib/server/game-status-settings'
import { getAssetsDir } from '@/lib/server/runtime-paths.mjs'

import type { StoredImportSession } from './session-store'
import type {
  NormalizedImageSource,
  NormalizedImportCharacter,
  NormalizedImportGame,
  NormalizedImportMemory,
} from './types'
import type {
  PlatformImportConflictStrategy,
  PlatformImportExecuteItemResult,
  PlatformImportExecuteResult,
  PlatformImportMatchType,
  PlatformImportOptions,
  PlatformImportPreviewItem,
  PlatformImportSessionPreview,
} from '@/types/platform-import'

type ExistingGameRow = {
  id: number
  name: string
  nameCn: string
  date: string
  cover: string
  bg: string
  icon: string
  logo: string
  summary: string
  tags: string
  ailases: string
  platforms: string
  gameType: string
  gameEngine: string
  music: string
  script: string
  graphic: string
  originalPainter: string
  animationProduction: string
  developer: string
  publisher: string
  programmer: string
  saveDir: string
  totalPlayTime: number
  status: number
  recordCount: number
}

export type ExistingGameMatch = {
  row: ExistingGameRow
  matchType: PlatformImportMatchType
  matchDetail: string
}

export type ExistingGameMatcher = {
  findMatch: (game: NormalizedImportGame) => ExistingGameMatch | null
  registerCreatedGame: (gameId: number, game: NormalizedImportGame) => void
}

function sanitizeFilePart(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned || fallback
}

const IMAGE_MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  avif: 'image/avif',
}

export function getImageMimeType(ext: string): string {
  return IMAGE_MIME_TYPES[ext.trim().toLowerCase()] || 'application/octet-stream'
}

export function detectImageExtFromBuffer(buf: Buffer): string {
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png'
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'jpg'
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp'
  }
  if (buf.length >= 6) {
    const header6 = buf.toString('ascii', 0, 6)
    if (header6 === 'GIF87a' || header6 === 'GIF89a') return 'gif'
  }
  if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d) {
    return 'bmp'
  }
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
    return 'ico'
  }
  const headText = buf.subarray(0, 256).toString('utf8').trimStart().toLowerCase()
  if (headText.startsWith('<svg') || (headText.startsWith('<?xml') && headText.includes('<svg'))) {
    return 'svg'
  }
  return ''
}

export async function resolveImageBuffer(
  source: NormalizedImageSource,
): Promise<{ buffer: Buffer; hintExt: string } | null> {
  if (source.kind === 'file') {
    if (!fs.existsSync(source.filePath)) return null
    const buffer = await fsp.readFile(source.filePath)
    const ext = path.extname(source.filePath).replace('.', '').toLowerCase()
    return { buffer, hintExt: ext }
  }
  if (source.kind === 'buffer') {
    return { buffer: source.data, hintExt: source.hintExt || '' }
  }
  if (source.kind === 'lazy-buffer') {
    const buffer = await source.read()
    if (!buffer || buffer.length === 0) return null
    return { buffer, hintExt: source.hintExt || '' }
  }
  return null
}

async function saveImportedGameImage(
  source: NormalizedImageSource | undefined,
  params: { gameName: string; releaseDate: string; imageType: 'cover' | 'bg' | 'icon' | 'logo' },
): Promise<string> {
  if (!source) return ''

  if (source.kind === 'url') {
    try {
      return await localizeGameImage({
        gameName: params.gameName,
        releaseDate: params.releaseDate,
        imageType: params.imageType,
        sourceUrl: source.url,
      })
    } catch {
      return source.url
    }
  }

  const resolved = await resolveImageBuffer(source).catch(() => null)
  if (!resolved || resolved.buffer.length === 0) return ''

  const ext = detectImageExtFromBuffer(resolved.buffer) || resolved.hintExt || 'jpg'
  const safeName = sanitizeFilePart(params.gameName, 'game')
  const safeDate = params.releaseDate
    ? sanitizeFilePart(params.releaseDate, 'unknown-date')
    : 'unknown-date'
  const targetDir = path.join(getAssetsDir(), params.imageType)
  await fsp.mkdir(targetDir, { recursive: true })

  let fileName = `${safeName}_${safeDate}_${params.imageType}.${ext}`
  let targetPath = path.join(targetDir, fileName)
  if (fs.existsSync(targetPath)) {
    fileName = `${safeName}_${safeDate}_${Date.now()}_${params.imageType}.${ext}`
    targetPath = path.join(targetDir, fileName)
  }

  await fsp.writeFile(targetPath, resolved.buffer)
  return `/assets/${params.imageType}/${fileName}`
}

async function saveImportedMemoryImage(
  gameId: number,
  source: NormalizedImageSource | undefined,
  index: number,
): Promise<string> {
  if (!source) return ''
  if (source.kind === 'url') return source.url

  const resolved = await resolveImageBuffer(source).catch(() => null)
  if (!resolved || resolved.buffer.length === 0) return ''

  const ext = detectImageExtFromBuffer(resolved.buffer) || resolved.hintExt || 'webp'
  const targetDir = path.join(getAssetsDir(), 'memory', String(gameId))
  await fsp.mkdir(targetDir, { recursive: true })
  const fileName = `import_${Date.now()}_${index}.${ext}`
  await fsp.writeFile(path.join(targetDir, fileName), resolved.buffer)
  return `/assets/memory/${gameId}/${fileName}`
}

async function saveImportedCharacterImage(
  gameId: number,
  vndbId: string,
  source: NormalizedImageSource | undefined,
  index: number,
): Promise<string> {
  if (!source) return ''
  if (source.kind === 'url') {
    try {
      return await localizeCharacterImage(gameId, vndbId, source.url)
    } catch {
      return source.url
    }
  }

  const resolved = await resolveImageBuffer(source).catch(() => null)
  if (!resolved || resolved.buffer.length === 0) return ''

  const ext = detectImageExtFromBuffer(resolved.buffer) || resolved.hintExt || 'jpg'
  const safeChar = sanitizeFilePart(vndbId, `char_${index}`)
  const targetDir = path.join(getAssetsDir(), 'characters', String(gameId))
  await fsp.mkdir(targetDir, { recursive: true })
  const fileName = `${safeChar}_${index}.${ext}`
  await fsp.writeFile(path.join(targetDir, fileName), resolved.buffer)
  return `/assets/characters/${gameId}/${fileName}`
}

async function resolveGameImagesForImport(
  images: NormalizedImportGame['images'],
  params: {
    gameName: string
    releaseDate: string
    fallbackCover?: string
    fallbackBg?: string
    fallbackIcon?: string
    fallbackLogo?: string
    onlyFillMissing?: boolean
  },
) {
  const resolveSlot = async (
    imageType: 'cover' | 'bg' | 'icon' | 'logo',
    source: NormalizedImageSource | undefined,
    fallback: string,
  ) => {
    if (params.onlyFillMissing && fallback) return fallback
    const saved = await saveImportedGameImage(source, {
      gameName: params.gameName,
      releaseDate: params.releaseDate,
      imageType,
    })
    return saved || fallback
  }

  const [cover, bg, icon, logo] = await Promise.all([
    resolveSlot('cover', images.cover, params.fallbackCover ?? ''),
    resolveSlot('bg', images.bg, params.fallbackBg ?? ''),
    resolveSlot('icon', images.icon, params.fallbackIcon ?? ''),
    resolveSlot('logo', images.logo, params.fallbackLogo ?? ''),
  ])

  return { cover, bg, icon, logo }
}

async function insertImportedMemories(
  gameId: number,
  memories: NormalizedImportMemory[],
  now: string,
  existingSet?: Set<string>,
): Promise<number> {
  let count = 0
  for (let i = 0; i < memories.length; i += 1) {
    const mem = memories[i]
    if (existingSet?.has(`${mem.title}|${mem.description}`)) continue
    const imageUrl = await saveImportedMemoryImage(gameId, mem.imageSource, i)
    await db.insert(GameMemoryTable).values({
      gameId,
      title: mem.title,
      description: mem.description,
      imageUrl,
      createdAt: mem.createdAt || now,
      updatedAt: mem.createdAt || now,
    })
    count += 1
  }
  return count
}

async function insertImportedCharacters(
  gameId: number,
  characters: NormalizedImportCharacter[],
  now: string,
  existingSets?: { vndbIds: Set<string>; names: Set<string> },
): Promise<number> {
  let count = 0
  for (let i = 0; i < characters.length; i += 1) {
    const ch = characters[i]
    if (
      existingSets &&
      (existingSets.vndbIds.has(ch.vndbId) ||
        existingSets.names.has(normalizeNameForMatch(ch.name)))
    ) {
      continue
    }
    const imageUrl = await saveImportedCharacterImage(gameId, ch.vndbId, ch.imageSource, i)
    await db
      .insert(CharacterTable)
      .values({
        gameId,
        vndbId: ch.vndbId,
        name: ch.name,
        original: ch.original,
        description: ch.description,
        imageUrl,
        bloodType: ch.bloodType,
        height: ch.height,
        weight: ch.weight,
        bust: ch.bust,
        waist: ch.waist,
        hips: ch.hips,
        age: ch.age,
        birthdayMonth: ch.birthdayMonth,
        birthdayDay: ch.birthdayDay,
        sex: ch.sex,
        gender: ch.gender,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({
        target: [CharacterTable.gameId, CharacterTable.vndbId],
      })
    count += 1
  }
  return count
}

export async function buildExistingGameMatcher(): Promise<ExistingGameMatcher> {
  const [games, idMaps, plays, records] = await Promise.all([
    db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        date: GameInfoTable.date,
        cover: GameInfoTable.cover,
        bg: GameInfoTable.bg,
        icon: GameInfoTable.icon,
        logo: GameInfoTable.logo,
        summary: GameInfoTable.summary,
        tags: GameInfoTable.tags,
        ailases: GameInfoTable.ailases,
        platforms: GameInfoTable.platforms,
        gameType: GameInfoTable.gameType,
        gameEngine: GameInfoTable.gameEngine,
        music: GameInfoTable.music,
        script: GameInfoTable.script,
        graphic: GameInfoTable.graphic,
        originalPainter: GameInfoTable.originalPainter,
        animationProduction: GameInfoTable.animationProduction,
        developer: GameInfoTable.developer,
        publisher: GameInfoTable.publisher,
        programmer: GameInfoTable.programmer,
        saveDir: GameInfoTable.saveDir,
      })
      .from(GameInfoTable),
    db
      .select({
        gameId: GameIdMapTable.gameId,
        provider: GameIdMapTable.provider,
        externalId: GameIdMapTable.externalId,
      })
      .from(GameIdMapTable),
    db
      .select({
        gameId: GamePlayTable.gameId,
        totalPlayTime: GamePlayTable.totalPlayTime,
        status: GamePlayTable.status,
      })
      .from(GamePlayTable),
    db.select({ gameId: GameRecordTable.gameId }).from(GameRecordTable),
  ])

  const playByGameId = new Map<number, { totalPlayTime: number; status: number }>()
  for (const play of plays) {
    if (!playByGameId.has(play.gameId)) {
      playByGameId.set(play.gameId, {
        totalPlayTime: Math.max(0, Number(play.totalPlayTime ?? 0)),
        status: play.status ?? 0,
      })
    }
  }

  const recordCountByGameId = new Map<number, number>()
  for (const rec of records) {
    recordCountByGameId.set(rec.gameId, (recordCountByGameId.get(rec.gameId) ?? 0) + 1)
  }

  const byId = new Map<number, ExistingGameRow>()
  const byExactName = new Map<string, ExistingGameRow>()
  const byLooseName = new Map<string, ExistingGameRow>()
  const byExternalId = new Map<string, ExistingGameRow>()

  const indexGameRow = (
    row: ExistingGameRow,
    externalIds: Array<{ provider: string; externalId: string }> = [],
  ) => {
    byId.set(row.id, row)

    const aliases = row.ailases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const names = dedupeStringList([row.name, row.nameCn, ...aliases])

    for (const candidate of names) {
      const exact = normalizeNameForMatch(candidate)
      if (exact && !byExactName.has(exact)) byExactName.set(exact, row)

      const loose = normalizeLooseNameForMatch(candidate)
      if (loose.length >= 2 && !byLooseName.has(loose)) byLooseName.set(loose, row)
    }

    for (const ext of externalIds) {
      const extKey = normalizeExternalIdPair(ext.provider, ext.externalId)
      if (extKey && !byExternalId.has(extKey)) byExternalId.set(extKey, row)
    }
  }

  for (const row of games) {
    const play = playByGameId.get(row.id)
    const normalizedRow: ExistingGameRow = {
      ...row,
      cover: row.cover ?? '',
      bg: row.bg ?? '',
      icon: row.icon ?? '',
      logo: row.logo ?? '',
      saveDir: row.saveDir ?? '',
      totalPlayTime: play?.totalPlayTime ?? 0,
      status: play?.status ?? 0,
      recordCount: recordCountByGameId.get(row.id) ?? 0,
    }
    indexGameRow(normalizedRow)
  }

  for (const mapping of idMaps) {
    const game = byId.get(mapping.gameId)
    if (!game) continue
    const extKey = normalizeExternalIdPair(mapping.provider, mapping.externalId)
    if (extKey && !byExternalId.has(extKey)) byExternalId.set(extKey, game)
  }

  return {
    findMatch(game: NormalizedImportGame): ExistingGameMatch | null {
      for (const ext of game.externalIds) {
        const extKey = normalizeExternalIdPair(ext.provider, ext.externalId)
        if (!extKey) continue
        const matched = byExternalId.get(extKey)
        if (matched) {
          return {
            row: matched,
            matchType: 'external_id',
            matchDetail: `${ext.provider}:${ext.externalId}`,
          }
        }
      }

      const candidates = dedupeStringList([game.name, game.nameCn, ...game.aliases])
      for (const candidate of candidates) {
        const exact = normalizeNameForMatch(candidate)
        if (exact && byExactName.has(exact)) {
          return {
            row: byExactName.get(exact)!,
            matchType: 'name',
            matchDetail: candidate,
          }
        }
      }

      for (const candidate of candidates) {
        const loose = normalizeLooseNameForMatch(candidate)
        if (loose.length >= 2 && byLooseName.has(loose)) {
          return {
            row: byLooseName.get(loose)!,
            matchType: 'name',
            matchDetail: candidate,
          }
        }
      }

      return null
    },
    registerCreatedGame(gameId: number, game: NormalizedImportGame) {
      indexGameRow(
        {
          id: gameId,
          name: game.name,
          nameCn: game.nameCn,
          date: game.date,
          cover: '',
          bg: '',
          icon: '',
          logo: '',
          summary: game.summary,
          tags: game.tags.join(','),
          ailases: game.aliases.join(','),
          platforms: game.platforms.join(','),
          gameType: game.gameType,
          gameEngine: game.gameEngine,
          music: game.music,
          script: game.script,
          graphic: game.graphic,
          originalPainter: game.originalPainter,
          animationProduction: game.animationProduction,
          developer: game.developer,
          publisher: game.publisher,
          programmer: game.programmer,
          saveDir: game.saveDir,
          totalPlayTime: game.totalPlayTime,
          status: game.playStatus,
          recordCount: game.records.length,
        },
        game.externalIds,
      )
    },
  }
}

export function buildSessionPreview(
  session: StoredImportSession,
  matcher: ExistingGameMatcher,
): PlatformImportSessionPreview {
  const collectionSet = new Set<string>()
  let existingGames = 0
  let totalRecords = 0
  let totalMemories = 0
  let totalCharacters = 0

  const items: PlatformImportPreviewItem[] = session.games.map((game) => {
    const match = matcher.findMatch(game)
    if (match) existingGames += 1

    for (const col of game.collections) {
      if (col.trim()) collectionSet.add(col.trim())
    }
    totalRecords += game.records.length
    totalMemories += game.memories.length
    totalCharacters += game.characters.length

    const coverUrl = game.images.cover
      ? game.images.cover.kind === 'url'
        ? game.images.cover.url
        : `/api/game/platform-import/cover?sessionId=${encodeURIComponent(session.sessionId)}&sourceId=${encodeURIComponent(game.sourceId)}`
      : match?.row.cover || undefined

    return {
      sourceId: game.sourceId,
      name: game.name,
      nameCn: game.nameCn,
      developer: game.developer,
      date: game.date,
      totalPlayTime: game.totalPlayTime,
      playStatus: game.playStatus,
      playStatusLabel: gamePlayStatusLabelMap[game.playStatus] ?? '未知',
      rating: game.rating,
      recordCount: game.records.length,
      collectionNames: game.collections,
      memoryCount: game.memories.length,
      characterCount: game.characters.length,
      hasCover: Boolean(game.images.cover),
      coverUrl,
      alreadyExists: Boolean(match),
      matchedGameId: match?.row.id,
      matchedGameName: match ? match.row.nameCn || match.row.name : undefined,
      matchType: match?.matchType,
      matchDetail: match?.matchDetail,
      matchedGamePlayTime: match?.row.totalPlayTime,
      matchedGameRecordCount: match?.row.recordCount,
      matchedGameStatusLabel: match
        ? (gamePlayStatusLabelMap[match.row.status] ?? '未知')
        : undefined,
      externalIds: game.externalIds,
    }
  })

  const collections = Array.from(collectionSet).sort((a, b) => a.localeCompare(b))

  return {
    sessionId: session.sessionId,
    platform: session.platform,
    detectedFormat: session.detectedFormat,
    items,
    collections,
    stats: {
      totalGames: items.length,
      existingGames,
      newGames: items.length - existingGames,
      totalCollections: collections.length,
      totalRecords,
      totalMemories,
      totalCharacters,
    },
    warnings: session.warnings,
  }
}

function mergeCsv(existing: string, incoming: string[]): string {
  const existingItems = existing
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return dedupeStringList([...existingItems, ...incoming]).join(',')
}

export async function executePlatformImport(
  session: StoredImportSession,
  selectedSourceIds: string[],
  options: PlatformImportOptions,
  itemStrategies?: Record<string, PlatformImportConflictStrategy>,
): Promise<PlatformImportExecuteResult> {
  await ensureGameCompletionSchema()
  await ensureGameStatusSchema()

  const statusRows = await db.select({ id: GameStatusTable.id }).from(GameStatusTable)
  const validStatusSet = new Set(statusRows.map((row) => row.id))
  const normalizeStatus = (status: number) => {
    if (validStatusSet.has(status)) return status
    if (validStatusSet.has(0)) return 0
    return -1
  }

  const existingCollections = await db
    .select({ id: CollectionTable.id, name: CollectionTable.name })
    .from(CollectionTable)
  const collectionMap = new Map<string, number>()
  for (const col of existingCollections) {
    collectionMap.set(col.name.trim().toLowerCase(), col.id)
  }

  let collectionsCreated = 0
  const ensureCollectionId = async (name: string): Promise<number | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const key = trimmed.toLowerCase()
    const existedId = collectionMap.get(key)
    if (existedId !== undefined) return existedId

    const now = dayjs().toISOString()
    const inserted = await db
      .insert(CollectionTable)
      .values({ name: trimmed, createdAt: now, updatedAt: now })
      .returning({ id: CollectionTable.id })
    const newId = inserted[0]?.id
    if (!newId) return null
    collectionMap.set(key, newId)
    collectionsCreated += 1
    return newId
  }

  const matcher = await buildExistingGameMatcher()
  const selectedSet = new Set(selectedSourceIds)
  const targets = session.games.filter((game) => selectedSet.has(game.sourceId))

  const itemResults: PlatformImportExecuteItemResult[] = []
  let importedCount = 0
  let mergedCount = 0
  let replacedCount = 0
  let skippedCount = 0
  let failedCount = 0
  let recordsImported = 0
  let memoriesImported = 0
  let charactersImported = 0

  for (const game of targets) {
    const displayName = game.nameCn || game.name
    try {
      const match = matcher.findMatch(game)
      const effectiveStrategy = itemStrategies?.[game.sourceId] ?? options.conflictStrategy

      if (match && effectiveStrategy === 'keep_existing') {
        skippedCount += 1
        itemResults.push({
          sourceId: game.sourceId,
          name: displayName,
          status: 'skipped',
          gameId: match.row.id,
          reason: `已保留当前库「${match.row.nameCn || match.row.name}」`,
        })
        continue
      }

      const now = dayjs().toISOString()
      const normalizedStatus = normalizeStatus(game.playStatus)

      if (match && effectiveStrategy === 'replace_with_imported') {
        const existing = match.row
        const gameId = existing.id
        const imageTitle = game.nameCn || game.name || existing.nameCn || existing.name
        const releaseDate = game.date || existing.date

        const resolvedImages = options.importImages
          ? await resolveGameImagesForImport(game.images, {
              gameName: imageTitle,
              releaseDate,
              fallbackCover: existing.cover,
              fallbackBg: existing.bg,
              fallbackIcon: existing.icon,
              fallbackLogo: existing.logo,
            })
          : {
              cover: existing.cover,
              bg: existing.bg,
              icon: existing.icon,
              logo: existing.logo,
            }

        await db
          .update(GameInfoTable)
          .set({
            name: game.name || existing.name,
            nameCn: game.nameCn || existing.nameCn,
            date: game.date || existing.date,
            cover: resolvedImages.cover,
            bg: resolvedImages.bg,
            icon: resolvedImages.icon,
            logo: resolvedImages.logo,
            summary: game.summary || existing.summary,
            tags: game.tags.length > 0 ? game.tags.join(',') : existing.tags,
            nsfw: game.nsfw ? 1 : 0,
            ailases: game.aliases.length > 0 ? game.aliases.join(',') : existing.ailases,
            platforms: game.platforms.length > 0 ? game.platforms.join(',') : existing.platforms,
            gameType: game.gameType || existing.gameType,
            gameEngine: game.gameEngine || existing.gameEngine,
            music: game.music || existing.music,
            script: game.script || existing.script,
            graphic: game.graphic || existing.graphic,
            originalPainter: game.originalPainter || existing.originalPainter,
            animationProduction: game.animationProduction || existing.animationProduction,
            developer: game.developer || existing.developer,
            publisher: game.publisher || existing.publisher,
            programmer: game.programmer || existing.programmer,
            saveDir: game.saveDir || existing.saveDir,
            updatedAt: now,
          })
          .where(eq(GameInfoTable.id, gameId))

        if (game.externalIds.length > 0) {
          await db
            .insert(GameIdMapTable)
            .values(
              game.externalIds.map((ext) => ({
                gameId,
                provider: ext.provider,
                externalId: ext.externalId,
              })),
            )
            .onConflictDoNothing({
              target: [GameIdMapTable.gameId, GameIdMapTable.provider, GameIdMapTable.externalId],
            })
        }

        if (game.websites.length > 0) {
          await db.delete(relateWebsiteTable).where(eq(relateWebsiteTable.gameId, gameId))
          await db.insert(relateWebsiteTable).values(
            game.websites.map((site) => ({
              gameId,
              name: site.name,
              url: site.url,
            })),
          )
        }

        if (options.importPlayRecords) {
          await db.delete(GameRecordTable).where(eq(GameRecordTable.gameId, gameId))
          if (game.records.length > 0) {
            await db.insert(GameRecordTable).values(
              game.records.map((rec) => ({
                gameId,
                playDate: rec.playDate,
                playTime: rec.playTime,
              })),
            )
            recordsImported += game.records.length
          }

          const playRows = await db
            .select()
            .from(GamePlayTable)
            .where(eq(GamePlayTable.gameId, gameId))
            .limit(1)
          const existingPlay = playRows[0]
          const importedLastRun = getLatestTimerEndAt(game.records)
          const nextPlayData = {
            exePath: game.exePath || existingPlay?.exePath || '',
            totalPlayTime: game.totalPlayTime,
            playCount: game.playCount,
            rating: game.rating,
            lastLaunchedAt:
              existingPlay?.isRunning === 1 ? existingPlay.lastLaunchedAt : importedLastRun,
            status: normalizedStatus,
            completedAt:
              normalizedStatus === 3 || normalizedStatus === 4
                ? game.completedAt || game.lastLaunchedAt || now
                : '',
          }

          if (existingPlay) {
            await db
              .update(GamePlayTable)
              .set(nextPlayData)
              .where(eq(GamePlayTable.id, existingPlay.id))
          } else {
            await db.insert(GamePlayTable).values({ gameId, ...nextPlayData })
          }
        }

        if (options.importCollections && game.collections.length > 0) {
          await db.delete(CollectionGameTable).where(eq(CollectionGameTable.gameId, gameId))
          const colIds = new Set<number>()
          for (const colName of game.collections) {
            const colId = await ensureCollectionId(colName)
            if (colId !== null && !colIds.has(colId)) {
              colIds.add(colId)
              await db.insert(CollectionGameTable).values({ collectionId: colId, gameId })
            }
          }
        }

        if (options.importMemories && session.platform === 'vnite' && game.memories.length > 0) {
          await db.delete(GameMemoryTable).where(eq(GameMemoryTable.gameId, gameId))
          memoriesImported += await insertImportedMemories(gameId, game.memories, now)
        }

        if (
          options.importCharacters &&
          session.platform === 'potatovn' &&
          game.characters.length > 0
        ) {
          await db.delete(CharacterTable).where(eq(CharacterTable.gameId, gameId))
          charactersImported += await insertImportedCharacters(gameId, game.characters, now)
        }

        replacedCount += 1
        itemResults.push({
          sourceId: game.sourceId,
          name: displayName,
          status: 'replaced',
          gameId,
        })
        continue
      }

      if (match) {
        const matched = match.row
        const gameId = matched.id
        const imageTitle = matched.nameCn || matched.name || displayName
        const releaseDate = matched.date || game.date

        const resolvedImages = options.importImages
          ? await resolveGameImagesForImport(game.images, {
              gameName: imageTitle,
              releaseDate,
              fallbackCover: matched.cover,
              fallbackBg: matched.bg,
              fallbackIcon: matched.icon,
              fallbackLogo: matched.logo,
              onlyFillMissing: true,
            })
          : {
              cover: matched.cover,
              bg: matched.bg,
              icon: matched.icon,
              logo: matched.logo,
            }

        await db
          .update(GameInfoTable)
          .set({
            date: matched.date || game.date,
            cover: resolvedImages.cover,
            bg: resolvedImages.bg,
            icon: resolvedImages.icon,
            logo: resolvedImages.logo,
            summary: matched.summary || game.summary,
            nameCn: matched.nameCn || game.nameCn,
            tags: mergeCsv(matched.tags, game.tags),
            ailases: mergeCsv(matched.ailases, game.aliases),
            platforms: mergeCsv(matched.platforms, game.platforms),
            gameType: matched.gameType || game.gameType,
            gameEngine: matched.gameEngine || game.gameEngine,
            music: matched.music || game.music,
            script: matched.script || game.script,
            graphic: matched.graphic || game.graphic,
            originalPainter: matched.originalPainter || game.originalPainter,
            animationProduction: matched.animationProduction || game.animationProduction,
            developer: matched.developer || game.developer,
            publisher: matched.publisher || game.publisher,
            programmer: matched.programmer || game.programmer,
            saveDir: matched.saveDir || game.saveDir,
            updatedAt: now,
          })
          .where(eq(GameInfoTable.id, gameId))

        if (game.externalIds.length > 0) {
          await db
            .insert(GameIdMapTable)
            .values(
              game.externalIds.map((ext) => ({
                gameId,
                provider: ext.provider,
                externalId: ext.externalId,
              })),
            )
            .onConflictDoNothing({
              target: [GameIdMapTable.gameId, GameIdMapTable.provider, GameIdMapTable.externalId],
            })
        }

        if (game.websites.length > 0) {
          const existingWebsites = await db
            .select({ url: relateWebsiteTable.url })
            .from(relateWebsiteTable)
            .where(eq(relateWebsiteTable.gameId, gameId))
          const urlSet = new Set(existingWebsites.map((item) => item.url.trim()))
          const missingWebsites = game.websites.filter((site) => !urlSet.has(site.url.trim()))
          if (missingWebsites.length > 0) {
            await db.insert(relateWebsiteTable).values(
              missingWebsites.map((site) => ({
                gameId,
                name: site.name,
                url: site.url,
              })),
            )
          }
        }

        if (options.importPlayRecords) {
          const existingRecs = await db
            .select({
              playDate: GameRecordTable.playDate,
              playTime: GameRecordTable.playTime,
            })
            .from(GameRecordTable)
            .where(eq(GameRecordTable.gameId, gameId))
          const recSet = new Set(
            existingRecs.map((rec) => `${rec.playDate ?? ''}|${rec.playTime ?? 0}`),
          )
          const toInsert = game.records.filter(
            (rec) => !recSet.has(`${rec.playDate}|${rec.playTime}`),
          )
          if (toInsert.length > 0) {
            await db.insert(GameRecordTable).values(
              toInsert.map((rec) => ({
                gameId,
                playDate: rec.playDate,
                playTime: rec.playTime,
              })),
            )
            recordsImported += toInsert.length
          }

          const mergedRecordsSum =
            existingRecs.reduce((sum, rec) => sum + Math.max(0, Number(rec.playTime ?? 0)), 0) +
            toInsert.reduce((sum, rec) => sum + rec.playTime, 0)
          const mergedRecordsCount = existingRecs.length + toInsert.length

          const playRows = await db
            .select()
            .from(GamePlayTable)
            .where(eq(GamePlayTable.gameId, gameId))
            .limit(1)
          const existingPlay = playRows[0]
          const nextStatus =
            existingPlay && existingPlay.status && existingPlay.status > 0
              ? existingPlay.status
              : normalizedStatus
          const mergedLastRun = getLatestTimerEndAt([...existingRecs, ...toInsert])
          const nextLastLaunched =
            existingPlay?.isRunning === 1 ? existingPlay.lastLaunchedAt : mergedLastRun
          const nextPlayData = {
            exePath: existingPlay?.exePath || game.exePath,
            totalPlayTime: Math.max(
              existingPlay?.totalPlayTime ?? 0,
              game.totalPlayTime,
              mergedRecordsSum,
            ),
            playCount: Math.max(existingPlay?.playCount ?? 0, game.playCount, mergedRecordsCount),
            rating:
              existingPlay?.rating && existingPlay.rating > 0 ? existingPlay.rating : game.rating,
            lastLaunchedAt: nextLastLaunched,
            status: nextStatus,
            completedAt:
              existingPlay?.completedAt ||
              game.completedAt ||
              resolveCompletedAt(nextStatus, existingPlay?.completedAt),
          }

          if (existingPlay) {
            await db
              .update(GamePlayTable)
              .set(nextPlayData)
              .where(eq(GamePlayTable.id, existingPlay.id))
          } else {
            await db.insert(GamePlayTable).values({ gameId, ...nextPlayData })
          }
        }

        if (options.importCollections && game.collections.length > 0) {
          const existingLinks = await db
            .select({ collectionId: CollectionGameTable.collectionId })
            .from(CollectionGameTable)
            .where(eq(CollectionGameTable.gameId, gameId))
          const linkedSet = new Set(existingLinks.map((item) => item.collectionId))
          for (const colName of game.collections) {
            const colId = await ensureCollectionId(colName)
            if (colId !== null && !linkedSet.has(colId)) {
              linkedSet.add(colId)
              await db.insert(CollectionGameTable).values({ collectionId: colId, gameId })
            }
          }
        }

        if (options.importMemories && game.memories.length > 0) {
          const existingMemories = await db
            .select({
              title: GameMemoryTable.title,
              description: GameMemoryTable.description,
            })
            .from(GameMemoryTable)
            .where(eq(GameMemoryTable.gameId, gameId))
          const memSet = new Set(
            existingMemories.map((m) => `${m.title ?? ''}|${m.description ?? ''}`),
          )
          memoriesImported += await insertImportedMemories(gameId, game.memories, now, memSet)
        }

        if (options.importCharacters && game.characters.length > 0) {
          const existingChars = await db
            .select({ vndbId: CharacterTable.vndbId, name: CharacterTable.name })
            .from(CharacterTable)
            .where(eq(CharacterTable.gameId, gameId))
          const existingSets = {
            vndbIds: new Set(existingChars.map((c) => c.vndbId)),
            names: new Set(existingChars.map((c) => normalizeNameForMatch(c.name))),
          }
          charactersImported += await insertImportedCharacters(
            gameId,
            game.characters,
            now,
            existingSets,
          )
        }

        mergedCount += 1
        itemResults.push({
          sourceId: game.sourceId,
          name: displayName,
          status: 'merged',
          gameId,
        })
        continue
      }

      // 新建游戏
      const resolvedImages = options.importImages
        ? await resolveGameImagesForImport(game.images, {
            gameName: displayName,
            releaseDate: game.date,
          })
        : { cover: '', bg: '', icon: '', logo: '' }

      const collectionIds: number[] = []
      if (options.importCollections && game.collections.length > 0) {
        for (const colName of game.collections) {
          const colId = await ensureCollectionId(colName)
          if (colId !== null) collectionIds.push(colId)
        }
      }

      const gameId = await db.transaction(async (tx) => {
        const inserted = await tx
          .insert(GameInfoTable)
          .values({
            date: game.date,
            cover: resolvedImages.cover,
            icon: resolvedImages.icon,
            logo: resolvedImages.logo,
            bg: resolvedImages.bg,
            summary: game.summary,
            name: game.name,
            nameCn: game.nameCn,
            tags: game.tags.join(','),
            nsfw: game.nsfw ? 1 : 0,
            ailases: game.aliases.join(','),
            platforms: game.platforms.join(','),
            gameType: game.gameType,
            gameEngine: game.gameEngine,
            music: game.music,
            script: game.script,
            graphic: game.graphic,
            originalPainter: game.originalPainter,
            animationProduction: game.animationProduction,
            developer: game.developer,
            publisher: game.publisher,
            programmer: game.programmer,
            saveDir: game.saveDir,
            createdAt: game.addedAt || now,
            updatedAt: now,
          })
          .returning({ id: GameInfoTable.id })

        const createdId = inserted[0]?.id
        if (!createdId) throw new Error('写入 game_info 失败')

        await tx.insert(GamePlayTable).values({
          gameId: createdId,
          exePath: game.exePath,
          totalPlayTime: options.importPlayRecords ? game.totalPlayTime : 0,
          playCount: options.importPlayRecords ? game.playCount : 0,
          rating: game.rating,
          lastLaunchedAt: options.importPlayRecords ? getLatestTimerEndAt(game.records) : '',
          status: normalizedStatus,
          completedAt:
            normalizedStatus === 3 || normalizedStatus === 4
              ? game.completedAt || game.lastLaunchedAt || now
              : '',
        })

        if (game.externalIds.length > 0) {
          await tx
            .insert(GameIdMapTable)
            .values(
              game.externalIds.map((ext) => ({
                gameId: createdId,
                provider: ext.provider,
                externalId: ext.externalId,
              })),
            )
            .onConflictDoNothing({
              target: [GameIdMapTable.gameId, GameIdMapTable.provider, GameIdMapTable.externalId],
            })
        }

        if (game.websites.length > 0) {
          await tx.insert(relateWebsiteTable).values(
            game.websites.map((site) => ({
              gameId: createdId,
              name: site.name,
              url: site.url,
            })),
          )
        }

        if (options.importPlayRecords && game.records.length > 0) {
          await tx.insert(GameRecordTable).values(
            game.records.map((rec) => ({
              gameId: createdId,
              playDate: rec.playDate,
              playTime: rec.playTime,
            })),
          )
          recordsImported += game.records.length
        }

        if (collectionIds.length > 0) {
          await tx.insert(CollectionGameTable).values(
            dedupeStringList(collectionIds.map(String)).map((idStr) => ({
              collectionId: Number(idStr),
              gameId: createdId,
            })),
          )
        }

        return createdId
      })

      if (options.importMemories && game.memories.length > 0) {
        memoriesImported += await insertImportedMemories(gameId, game.memories, now)
      }

      if (options.importCharacters && game.characters.length > 0) {
        charactersImported += await insertImportedCharacters(gameId, game.characters, now)
      }

      matcher.registerCreatedGame(gameId, game)
      importedCount += 1
      itemResults.push({
        sourceId: game.sourceId,
        name: displayName,
        status: 'imported',
        gameId,
      })
    } catch (error) {
      failedCount += 1
      itemResults.push({
        sourceId: game.sourceId,
        name: displayName,
        status: 'failed',
        reason: (error as Error).message || '导入失败',
      })
    }
  }

  return {
    importedCount,
    mergedCount,
    replacedCount,
    skippedCount,
    failedCount,
    collectionsCreated,
    recordsImported,
    memoriesImported,
    charactersImported,
    items: itemResults,
  }
}
