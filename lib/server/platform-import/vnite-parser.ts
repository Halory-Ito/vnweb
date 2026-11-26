import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

import { readPouchDbDirectory } from './leveldb-reader'
import {
  createEmptyNormalizedGame,
  dedupeStringList,
  extractExternalIdsFromUrls,
  normalizeIsoDateOnly,
  normalizeIsoDateTime,
  safeExtractZipToDir,
  stripHtmlToText,
} from './types'

import type { NormalizedImageSource, NormalizedImportGame, ParsedPlatformData } from './types'

type VniteParserInput = {
  fileBuffer?: Buffer
  fileName?: string
  localPath?: string
  tempDir: string
}

const VNITE_PLAY_STATUS_MAP: Record<string, number> = {
  unplayed: 0,
  playing: 1,
  partial: 2,
  finished: 3,
  multiple: 4,
  shelved: 5,
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return dedupeStringList(value.map((item) => asString(item)))
}

function applyVniteExtra(
  game: NormalizedImportGame,
  extra: Array<{ key?: unknown; value?: unknown }> | undefined,
) {
  if (!Array.isArray(extra)) return
  for (const item of extra) {
    const key = asString(item?.key).toLowerCase()
    const values = asStringArray(item?.value)
    if (!key || values.length === 0) continue
    const joined = values.join(', ')

    if (key === 'scenario' || key === 'script' || key === '剧本') {
      game.script = game.script || joined
    } else if (key === 'illustration' || key === 'originalpainter' || key === '原画') {
      game.originalPainter = game.originalPainter || joined
    } else if (key === 'music' || key === '音乐') {
      game.music = game.music || joined
    } else if (key === 'engine' || key === 'gameengine' || key === '引擎') {
      game.gameEngine = game.gameEngine || joined
    } else if (key === 'graphic' || key === '美术') {
      game.graphic = game.graphic || joined
    } else if (key === 'programmer' || key === '程序') {
      game.programmer = game.programmer || joined
    }
  }
}

function normalizeVniteExternalIds(
  metadata: Record<string, unknown>,
  websites: Array<{ name: string; url: string }>,
) {
  const fromUrls = extractExternalIdsFromUrls(websites.map((item) => item.url))
  const seen = new Set(fromUrls.map((item) => `${item.provider}:${item.externalId}`))
  const add = (provider: string, rawId: string) => {
    let normalized = rawId.trim()
    if (!normalized) return
    if (provider === 'vndb') {
      normalized = normalized.toLowerCase()
      if (/^\d+$/.test(normalized)) normalized = `v${normalized}`
    } else if (provider === 'ymgal') {
      normalized = normalized.replace(/^[gG][aA]/, '')
    }
    const key = `${provider}:${normalized}`
    if (seen.has(key)) return
    seen.add(key)
    fromUrls.push({ provider, externalId: normalized })
  }

  add('steam', asString(metadata.steamId))
  add('vndb', asString(metadata.vndbId))
  add('ymgal', asString(metadata.ymgalId))
  add('igdb', asString(metadata.igdbId))
  return fromUrls
}

function mapVniteGameDoc(
  doc: Record<string, unknown>,
  index: number,
  options: {
    localDoc?: Record<string, unknown>
    collections?: string[]
    getAttachmentBuffer?: (doc: Record<string, unknown>, attachmentId: string) => Buffer | null
  } = {},
): NormalizedImportGame | null {
  const metadata = (doc.metadata ?? {}) as Record<string, unknown>
  const originalName = asString(metadata.originalName)
  const mainName = asString(metadata.name)
  const name = originalName || mainName
  const nameCn = mainName || originalName

  if (!name && !nameCn) return null

  const sourceId = asString(doc._id) || asString(metadata.id) || `vnite_${index + 1}`
  const game = createEmptyNormalizedGame(sourceId)
  game.name = name || nameCn
  game.nameCn = nameCn || name
  game.date = normalizeIsoDateOnly(metadata.releaseDate)
  game.summary = stripHtmlToText(asString(metadata.description))
  game.developer = asStringArray(metadata.developers).join(', ')
  game.publisher = asStringArray(metadata.publishers).join(', ')
  game.platforms = asStringArray(metadata.platforms)
  game.gameType = asStringArray(metadata.genres).join(', ')
  game.tags = asStringArray(metadata.tags)
  game.collections = dedupeStringList(options.collections ?? [])

  const relatedSites = Array.isArray(metadata.relatedSites) ? metadata.relatedSites : []
  for (const site of relatedSites) {
    if (!site || typeof site !== 'object') continue
    const label = asString((site as Record<string, unknown>).label) || 'Website'
    const url = asString((site as Record<string, unknown>).url)
    if (url) game.websites.push({ name: label, url })
  }

  game.externalIds = normalizeVniteExternalIds(metadata, game.websites)
  applyVniteExtra(game, metadata.extra as Array<{ key?: unknown; value?: unknown }> | undefined)

  const appearance = (doc.apperance ?? doc.appearance ?? {}) as Record<string, unknown>
  game.nsfw = Boolean(appearance.nsfw)

  const record = (doc.record ?? {}) as Record<string, unknown>
  const rawPlayTimeMs = Number(record.playTime ?? record.playingTime ?? 0)
  let totalSeconds =
    Number.isFinite(rawPlayTimeMs) && rawPlayTimeMs > 0 ? Math.round(rawPlayTimeMs / 1000) : 0

  const timers = Array.isArray(record.timers)
    ? record.timers
    : Array.isArray(record.timer)
      ? record.timer
      : []

  for (const timer of timers) {
    if (!timer || typeof timer !== 'object') continue
    const startRaw = (timer as Record<string, unknown>).start
    const endRaw = (timer as Record<string, unknown>).end
    const startIso = normalizeIsoDateTime(startRaw)
    const startMs = typeof startRaw === 'string' ? Date.parse(startRaw) : Number(startRaw)
    const endMs = typeof endRaw === 'string' ? Date.parse(endRaw) : Number(endRaw)
    if (!startIso || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      continue
    }
    const durationSec = Math.round((endMs - startMs) / 1000)
    if (durationSec > 0) {
      game.records.push({ playDate: startIso, playTime: durationSec })
    }
  }

  const dailyPlayTimes = Array.isArray(record.dailyPlayTimes) ? record.dailyPlayTimes : []
  for (const item of dailyPlayTimes) {
    if (!item || typeof item !== 'object') continue
    const dateOnly = normalizeIsoDateOnly((item as Record<string, unknown>).date)
    const itemMs = Number((item as Record<string, unknown>).playTime ?? 0)
    const sec = Number.isFinite(itemMs) && itemMs > 0 ? Math.round(itemMs / 1000) : 0
    if (dateOnly && sec > 0) {
      game.records.push({ playDate: `${dateOnly}T12:00:00.000Z`, playTime: sec })
    }
  }

  if (totalSeconds === 0 && game.records.length > 0) {
    totalSeconds = game.records.reduce((sum, item) => sum + item.playTime, 0)
  }

  game.totalPlayTime = totalSeconds
  game.playCount = game.records.length || (totalSeconds > 0 ? 1 : 0)
  game.lastLaunchedAt = normalizeIsoDateTime(record.lastRunDate)
  game.addedAt = normalizeIsoDateTime(record.addDate)

  const rawScore = Number(record.score)
  if (Number.isFinite(rawScore) && rawScore >= 0) {
    game.rating = Math.max(0, Math.min(10, Math.round(rawScore)))
  }

  const statusKey = asString(record.playStatus).toLowerCase()
  game.playStatus = VNITE_PLAY_STATUS_MAP[statusKey] ?? (totalSeconds > 0 ? 1 : 0)
  if (game.playStatus === 3 || game.playStatus === 4) {
    game.completedAt = game.lastLaunchedAt
  }

  if (options.localDoc) {
    const launcher = (options.localDoc.launcher ?? {}) as Record<string, unknown>
    const fileConfig = (launcher.fileConfig ?? {}) as Record<string, unknown>
    const pathObj = (options.localDoc.path ?? {}) as Record<string, unknown>
    game.exePath = asString(fileConfig.path) || asString(pathObj.gamePath)
    const savePaths = asStringArray(pathObj.savePaths)
    game.saveDir = savePaths[0] ?? ''
  }

  const getAtt = options.getAttachmentBuffer
  if (getAtt) {
    const attachments = (doc._attachments ?? {}) as Record<string, unknown>
    const attachLazy = (attId: string): NormalizedImageSource | undefined => {
      if (!Object.hasOwn(attachments, attId)) return undefined
      return {
        kind: 'lazy-buffer',
        hintExt: 'webp',
        read: async () => getAtt(doc, attId),
      }
    }

    const cover = attachLazy('images/cover.webp')
    const bg = attachLazy('images/background.webp')
    const icon = attachLazy('images/icon.webp')
    const logo = attachLazy('images/logo.webp')
    if (cover) game.images.cover = cover
    if (bg) game.images.bg = bg
    if (icon) game.images.icon = icon
    if (logo) game.images.logo = logo
  }

  const memoryList = ((doc.memory as Record<string, unknown> | undefined)?.memoryList ??
    {}) as Record<string, unknown>
  for (const [memKey, rawMemory] of Object.entries(memoryList)) {
    if (!rawMemory || typeof rawMemory !== 'object') continue
    const mem = rawMemory as Record<string, unknown>
    const memId = asString(mem._id) || asString(mem.id) || memKey
    const dateRaw = asString(mem.date)
    const note = asString(mem.note)
    const createdAt = normalizeIsoDateTime(dateRaw)

    let imageSource: NormalizedImageSource | undefined
    if (getAtt) {
      const attachments = (doc._attachments ?? {}) as Record<string, unknown>
      const attId = `images/memories/${memId}.webp`
      if (Object.hasOwn(attachments, attId)) {
        imageSource = {
          kind: 'lazy-buffer',
          hintExt: 'webp',
          read: async () => getAtt(doc, attId),
        }
      }
    }

    if (!note && !imageSource) continue
    game.memories.push({
      title: dateRaw ? `回忆 (${normalizeIsoDateOnly(dateRaw) || dateRaw})` : 'Vnite 回忆',
      description: note,
      createdAt,
      imageSource,
    })
  }

  return game
}

function isLevelDbDir(dir: string): boolean {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return false
  if (fs.existsSync(path.join(dir, 'CURRENT'))) return true
  const files = fs.readdirSync(dir)
  return files.some((name) => /\.(ldb|sst|log)$/i.test(name))
}

async function detectVniteDir(
  rootDir: string,
): Promise<
  { kind: 'v3'; dbRoot: string } | { kind: 'v2'; gamesDir: string; rootDir: string } | null
> {
  const candidates = [
    rootDir,
    path.join(rootDir, 'database'),
    path.join(rootDir, 'app', 'database'),
    path.join(rootDir, 'app'),
  ]

  const topEntries = await fsp.readdir(rootDir, { withFileTypes: true }).catch(() => [])
  for (const entry of topEntries) {
    if (entry.isDirectory()) {
      const sub = path.join(rootDir, entry.name)
      candidates.push(sub, path.join(sub, 'database'), path.join(sub, 'app', 'database'))
    }
  }

  for (const candidate of candidates) {
    const gameDb = path.join(candidate, 'game')
    if (isLevelDbDir(gameDb)) {
      return { kind: 'v3', dbRoot: candidate }
    }
  }

  for (const candidate of candidates) {
    const gamesDir = path.join(candidate, 'games')
    if (fs.existsSync(gamesDir) && fs.statSync(gamesDir).isDirectory()) {
      const subDirs = await fsp.readdir(gamesDir, { withFileTypes: true }).catch(() => [])
      const hasV2Game = subDirs.some(
        (d) => d.isDirectory() && fs.existsSync(path.join(gamesDir, d.name, 'metadata.json')),
      )
      if (hasV2Game) {
        return { kind: 'v2', gamesDir, rootDir: candidate }
      }
    }
  }

  return null
}

async function parseVniteV3Dir(dbRoot: string): Promise<ParsedPlatformData> {
  const warnings: string[] = []
  const gameDb = await readPouchDbDirectory(path.join(dbRoot, 'game'))
  warnings.push(...gameDb.warnings)

  const localMap = new Map<string, Record<string, unknown>>()
  const localDir = path.join(dbRoot, 'game-local')
  if (isLevelDbDir(localDir)) {
    try {
      const localDb = await readPouchDbDirectory(localDir)
      warnings.push(...localDb.warnings)
      for (const doc of localDb.docs) {
        const id = asString(doc._id)
        if (id) localMap.set(id, doc)
      }
    } catch (error) {
      warnings.push(`读取 game-local 失败: ${(error as Error).message}`)
    }
  }

  const gameCollectionsMap = new Map<string, string[]>()
  const collectionDir = path.join(dbRoot, 'game-collection')
  if (isLevelDbDir(collectionDir)) {
    try {
      const colDb = await readPouchDbDirectory(collectionDir)
      warnings.push(...colDb.warnings)
      for (const colDoc of colDb.docs) {
        const colName = asString(colDoc.name)
        const gameIds = Array.isArray(colDoc.games) ? colDoc.games : []
        if (!colName) continue
        for (const rawGid of gameIds) {
          const gid = asString(rawGid)
          if (!gid) continue
          const list = gameCollectionsMap.get(gid) ?? []
          list.push(colName)
          gameCollectionsMap.set(gid, list)
        }
      }
    } catch (error) {
      warnings.push(`读取 game-collection 失败: ${(error as Error).message}`)
    }
  }

  const games: NormalizedImportGame[] = []
  gameDb.docs.forEach((doc, idx) => {
    const id = asString(doc._id)
    const mapped = mapVniteGameDoc(doc, idx, {
      localDoc: id ? localMap.get(id) : undefined,
      collections: id ? gameCollectionsMap.get(id) : undefined,
      getAttachmentBuffer: gameDb.getAttachmentBuffer,
    })
    if (mapped) games.push(mapped)
  })

  return {
    platform: 'vnite',
    detectedFormat: 'Vnite v3/v4 数据库（PouchDB / LevelDB）',
    games,
    warnings,
  }
}

async function readOptionalJson<T>(filePath: string): Promise<T | null> {
  try {
    const text = await fsp.readFile(filePath, 'utf8')
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function findFirstExistingImageFile(
  baseDir: string,
  stem: string,
): NormalizedImageSource | undefined {
  for (const ext of ['webp', 'png', 'jpg', 'jpeg', 'ico']) {
    const candidate = path.join(/*turbopackIgnore: true*/ baseDir, `${stem}.${ext}`)
    if (
      fs.existsSync(/*turbopackIgnore: true*/ candidate) &&
      fs.statSync(/*turbopackIgnore: true*/ candidate).isFile()
    ) {
      return { kind: 'file', filePath: candidate }
    }
  }
  return undefined
}

async function parseVniteV2Dir(rootDir: string, gamesDir: string): Promise<ParsedPlatformData> {
  const warnings: string[] = []
  const gameCollectionsMap = new Map<string, string[]>()

  const collectionsJson = await readOptionalJson<
    Record<string, { name?: string; games?: string[] }>
  >(path.join(rootDir, 'collections.json'))

  if (collectionsJson && typeof collectionsJson === 'object') {
    for (const col of Object.values(collectionsJson)) {
      const colName = asString(col?.name)
      if (!colName || !Array.isArray(col?.games)) continue
      for (const gid of col.games) {
        const list = gameCollectionsMap.get(gid) ?? []
        list.push(colName)
        gameCollectionsMap.set(gid, list)
      }
    }
  }

  const entries = await fsp.readdir(gamesDir, { withFileTypes: true })
  const games: NormalizedImportGame[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const gameId = entry.name
    const gameDir = path.join(gamesDir, gameId)
    const metadata = await readOptionalJson<Record<string, unknown>>(
      path.join(gameDir, 'metadata.json'),
    )
    if (!metadata) continue

    const record =
      (await readOptionalJson<Record<string, unknown>>(path.join(gameDir, 'record.json'))) ?? {}
    const launcher =
      (await readOptionalJson<Record<string, unknown>>(path.join(gameDir, 'launcher.json'))) ?? {}
    const pathJson =
      (await readOptionalJson<Record<string, unknown>>(path.join(gameDir, 'path.json'))) ?? {}
    const memory =
      (await readOptionalJson<Record<string, unknown>>(path.join(gameDir, 'memory.json'))) ?? {}

    const syntheticDoc: Record<string, unknown> = {
      _id: gameId,
      metadata,
      record,
      memory,
    }
    const localDoc: Record<string, unknown> = {
      launcher,
      path: {
        gamePath: pathJson.gamePath,
        savePaths: pathJson.savePath ?? pathJson.savePaths ?? [],
      },
    }

    const mapped = mapVniteGameDoc(syntheticDoc, games.length, {
      localDoc,
      collections: gameCollectionsMap.get(gameId),
    })
    if (!mapped) continue

    const cover = findFirstExistingImageFile(gameDir, 'cover')
    const bg = findFirstExistingImageFile(gameDir, 'background')
    const icon = findFirstExistingImageFile(gameDir, 'icon')
    const logo = findFirstExistingImageFile(gameDir, 'logo')
    if (cover) mapped.images.cover = cover
    if (bg) mapped.images.bg = bg
    if (icon) mapped.images.icon = icon
    if (logo) mapped.images.logo = logo

    const memDir = path.join(gameDir, 'memories')
    if (fs.existsSync(memDir) && fs.statSync(memDir).isDirectory()) {
      const memEntries = Object.entries(
        (memory.memoryList as Record<string, { id?: string; _id?: string }>) ?? {},
      )
      memEntries.forEach(([key, item], idx) => {
        const memId = asString(item?.id || item?._id || key)
        const memImg = memId ? findFirstExistingImageFile(memDir, memId) : undefined
        if (memImg && mapped.memories[idx]) {
          mapped.memories[idx].imageSource = memImg
        }
      })
    }

    games.push(mapped)
  }

  return {
    platform: 'vnite',
    detectedFormat: 'Vnite v2 目录结构',
    games,
    warnings,
  }
}

function parseVniteJsonPayload(rawJson: unknown): NormalizedImportGame[] {
  let docs: Record<string, unknown>[] = []

  if (Array.isArray(rawJson)) {
    docs = rawJson.filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === 'object' && 'metadata' in item),
    )
  } else if (rawJson && typeof rawJson === 'object') {
    const record = rawJson as Record<string, unknown>
    if ('metadata' in record) {
      docs = [record]
    } else {
      docs = Object.values(record).filter((item): item is Record<string, unknown> =>
        Boolean(item && typeof item === 'object' && 'metadata' in item),
      )
    }
  }

  if (docs.length === 0) {
    throw new Error('Vnite JSON 中未找到有效的 gameDoc 数据')
  }

  return docs
    .map((doc, idx) => mapVniteGameDoc(doc, idx))
    .filter((item): item is NormalizedImportGame => item !== null)
}

export async function parseVniteImportData(input: VniteParserInput): Promise<ParsedPlatformData> {
  if (input.fileBuffer) {
    const ext = path.extname(input.fileName || '').toLowerCase()
    if (ext === '.json') {
      const parsed = JSON.parse(input.fileBuffer.toString('utf8')) as unknown
      return {
        platform: 'vnite',
        detectedFormat: 'Vnite JSON 导出文件',
        games: parseVniteJsonPayload(parsed),
        warnings: [],
      }
    }

    if (ext !== '.zip') {
      throw new Error('Vnite 文件仅支持 .zip 数据库备份包或 .json 导出文件')
    }

    await safeExtractZipToDir(input.fileBuffer, input.tempDir)
    const detected = await detectVniteDir(input.tempDir)
    if (!detected) {
      throw new Error('ZIP 备份包中未找到 Vnite 数据库目录（game/ 或 games/）')
    }

    const result =
      detected.kind === 'v3'
        ? await parseVniteV3Dir(detected.dbRoot)
        : await parseVniteV2Dir(detected.rootDir, detected.gamesDir)
    return { ...result, tempDir: input.tempDir }
  }

  const localPath = (input.localPath || '').trim()
  if (!localPath) {
    throw new Error('请选择 Vnite 备份文件或数据库目录')
  }
  if (!fs.existsSync(localPath)) {
    throw new Error(`路径不存在: ${localPath}`)
  }

  const stat = await fsp.stat(localPath)
  if (stat.isFile()) {
    const buf = await fsp.readFile(localPath)
    return parseVniteImportData({
      fileBuffer: buf,
      fileName: path.basename(localPath),
      tempDir: input.tempDir,
    })
  }

  const detected = await detectVniteDir(localPath)
  if (!detected) {
    throw new Error('指定目录中未找到 Vnite 数据库（game/ 或 games/）')
  }

  return detected.kind === 'v3'
    ? parseVniteV3Dir(detected.dbRoot)
    : parseVniteV2Dir(detected.rootDir, detected.gamesDir)
}
