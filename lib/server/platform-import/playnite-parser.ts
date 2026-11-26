import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

import { readLiteDbCollection } from './litedb-v4-reader'
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

const STEAM_PLUGIN_ID = 'cb91dfc9-b977-43bf-8e70-55f46e410fab'

type PlayniteParserInput = {
  fileBuffer?: Buffer
  fileName?: string
  localPath?: string
  tempDir: string
}

function getProp(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (Object.hasOwn(obj, key) && obj[key] !== undefined) return obj[key]
  }
  const lowerEntries = new Map<string, unknown>()
  for (const [k, v] of Object.entries(obj)) {
    lowerEntries.set(k.toLowerCase(), v)
  }
  for (const key of keys) {
    const val = lowerEntries.get(key.toLowerCase())
    if (val !== undefined) return val
  }
  return undefined
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => asTrimmedString(item)).filter(Boolean)
}

function resolveNamesByIds(
  rawIds: unknown,
  rawInlineNames: unknown,
  lookup: Map<string, string>,
): string[] {
  const result: string[] = []
  if (Array.isArray(rawInlineNames)) {
    for (const item of rawInlineNames) {
      if (typeof item === 'string') {
        if (item.trim()) result.push(item.trim())
      } else if (item && typeof item === 'object') {
        const name = asTrimmedString(getProp(item as Record<string, unknown>, 'Name'))
        if (name) result.push(name)
      }
    }
  } else if (typeof rawInlineNames === 'string' && rawInlineNames.trim()) {
    result.push(...rawInlineNames.split(',').map((s) => s.trim()))
  }

  if (Array.isArray(rawIds)) {
    for (const id of rawIds) {
      const key = asTrimmedString(id).toLowerCase()
      const mapped = key ? lookup.get(key) : undefined
      if (mapped) result.push(mapped)
    }
  }

  return dedupeStringList(result)
}

function mapPlayniteStatus(statusName: string, totalPlayTime: number): number {
  const normalized = statusName.trim().toLowerCase()
  if (!normalized) {
    return totalPlayTime > 0 ? 1 : 0
  }
  if (
    normalized.includes('not played') ||
    normalized.includes('plan to play') ||
    normalized.includes('unplayed') ||
    normalized.includes('未游玩') ||
    normalized.includes('未开始') ||
    normalized.includes('计划') ||
    normalized.includes('想玩')
  ) {
    return 0
  }
  if (
    normalized.includes('playing') ||
    normalized.includes('游玩中') ||
    normalized.includes('在玩')
  ) {
    return 1
  }
  if (normalized.includes('partial') || normalized.includes('部分') || normalized === 'played') {
    return 2
  }
  if (
    normalized.includes('completed') ||
    normalized.includes('beaten') ||
    normalized.includes('finished') ||
    normalized.includes('已完成') ||
    normalized.includes('通关') ||
    normalized.includes('已玩')
  ) {
    return 3
  }
  if (normalized.includes('multiple') || normalized.includes('多周目')) {
    return 4
  }
  if (
    normalized.includes('on hold') ||
    normalized.includes('abandoned') ||
    normalized.includes('dropped') ||
    normalized.includes('shelved') ||
    normalized.includes('搁置') ||
    normalized.includes('放弃') ||
    normalized.includes('抛弃')
  ) {
    return 5
  }
  return totalPlayTime > 0 ? 1 : 0
}

function resolvePlayniteReleaseDate(raw: unknown): string {
  if (raw && typeof raw === 'object' && !(raw instanceof Date)) {
    const inner = getProp(raw as Record<string, unknown>, 'ReleaseDate', 'Date')
    return normalizeIsoDateOnly(inner)
  }
  return normalizeIsoDateOnly(raw)
}

function resolvePlayniteImageSource(
  rawValue: unknown,
  mediaDirs: string[],
): NormalizedImageSource | undefined {
  const val = asTrimmedString(rawValue)
  if (!val) return undefined
  if (/^https?:\/\//i.test(val)) {
    return { kind: 'url', url: val }
  }

  const normalizedRel = val.replace(/\\/g, '/').replace(/^\/+/, '')
  for (const mediaDir of mediaDirs) {
    const resolvedRoot = path.resolve(mediaDir)
    const candidate = path.resolve(resolvedRoot, ...normalizedRel.split('/').filter(Boolean))
    if (
      (candidate === resolvedRoot || candidate.startsWith(resolvedRoot + path.sep)) &&
      fs.existsSync(candidate) &&
      fs.statSync(candidate).isFile()
    ) {
      return { kind: 'file', filePath: candidate }
    }
  }

  if (path.isAbsolute(val) && fs.existsSync(val) && fs.statSync(val).isFile()) {
    return { kind: 'file', filePath: val }
  }

  return undefined
}

function resolvePlayniteExePath(doc: Record<string, unknown>): string {
  const installDir = asTrimmedString(getProp(doc, 'InstallDirectory'))
  const rawActions = getProp(doc, 'GameActions')
  if (!Array.isArray(rawActions)) return ''

  for (const rawAction of rawActions) {
    if (!rawAction || typeof rawAction !== 'object') continue
    const action = rawAction as Record<string, unknown>
    const type = getProp(action, 'Type')
    if (type !== undefined && type !== 0 && String(type).toLowerCase() !== 'file') {
      continue
    }
    const rawPath = asTrimmedString(getProp(action, 'Path'))
    if (!rawPath) continue

    if (/\{InstallDir\}/i.test(rawPath)) {
      if (!installDir) continue
      return rawPath.replace(/\{InstallDir\}/gi, installDir).replace(/\\\\+/g, '\\')
    }

    if (path.win32.isAbsolute(rawPath)) {
      return rawPath
    }
    if (installDir && !/^[a-z]+:\/\//i.test(rawPath)) {
      return path.win32.join(installDir, rawPath)
    }
  }

  return ''
}

async function readPlayniteLookupTable(dbPath: string): Promise<{
  map: Map<string, string>
  warnings: string[]
}> {
  const map = new Map<string, string>()
  if (!fs.existsSync(dbPath)) {
    return { map, warnings: [] }
  }

  try {
    const res = await readLiteDbCollection(dbPath)
    for (const doc of res.documents) {
      const id = asTrimmedString(getProp(doc, '_id', 'Id')).toLowerCase()
      const name = asTrimmedString(getProp(doc, 'Name'))
      if (id && name) {
        map.set(id, name)
      }
    }
    return { map, warnings: res.warnings }
  } catch (error) {
    return {
      map,
      warnings: [`读取 ${path.basename(dbPath)} 失败: ${(error as Error).message}`],
    }
  }
}

async function findPlayniteRoot(rootDir: string): Promise<{
  dbDir: string
  mediaDirs: string[]
} | null> {
  const candidates = [rootDir, path.join(rootDir, 'library')]

  const entries = await fsp.readdir(rootDir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sub = path.join(rootDir, entry.name)
      candidates.push(sub, path.join(sub, 'library'))
    }
  }

  for (const candidate of candidates) {
    const gamesDb = path.join(candidate, 'games.db')
    if (fs.existsSync(gamesDb) && fs.statSync(gamesDb).isFile()) {
      const mediaDirs = [
        path.join(candidate, 'files'),
        path.join(rootDir, 'libraryfiles'),
        path.join(path.dirname(candidate), 'libraryfiles'),
        path.join(rootDir, 'files'),
      ].filter(
        (dir) =>
          fs.existsSync(/*turbopackIgnore: true*/ dir) &&
          fs.statSync(/*turbopackIgnore: true*/ dir).isDirectory(),
      )

      return { dbDir: candidate, mediaDirs: dedupeStringList(mediaDirs) }
    }
  }

  return null
}

function mapPlayniteGameDoc(
  doc: Record<string, unknown>,
  index: number,
  lookups: {
    companies: Map<string, string>
    platforms: Map<string, string>
    tags: Map<string, string>
    genres: Map<string, string>
    categories: Map<string, string>
    completionStatuses: Map<string, string>
  },
  mediaDirs: string[],
): NormalizedImportGame | null {
  const name = asTrimmedString(getProp(doc, 'Name'))
  if (!name) return null

  const sourceId = asTrimmedString(getProp(doc, '_id', 'Id')) || `playnite_${index + 1}`
  const game = createEmptyNormalizedGame(sourceId)
  game.name = name
  game.nameCn = name
  game.date = resolvePlayniteReleaseDate(getProp(doc, 'ReleaseDate'))
  game.summary = stripHtmlToText(asTrimmedString(getProp(doc, 'Description')))

  const developers = resolveNamesByIds(
    getProp(doc, 'DeveloperIds'),
    getProp(doc, 'Developers'),
    lookups.companies,
  )
  const publishers = resolveNamesByIds(
    getProp(doc, 'PublisherIds'),
    getProp(doc, 'Publishers'),
    lookups.companies,
  )
  const platforms = resolveNamesByIds(
    getProp(doc, 'PlatformIds'),
    getProp(doc, 'Platforms'),
    lookups.platforms,
  )
  const tags = resolveNamesByIds(getProp(doc, 'TagIds'), getProp(doc, 'Tags'), lookups.tags)
  const genres = resolveNamesByIds(getProp(doc, 'GenreIds'), getProp(doc, 'Genres'), lookups.genres)
  const collections = resolveNamesByIds(
    getProp(doc, 'CategoryIds'),
    getProp(doc, 'Categories'),
    lookups.categories,
  )

  game.developer = developers.join(', ')
  game.publisher = publishers.join(', ')
  game.platforms = platforms
  game.tags = tags
  game.gameType = genres.join(', ')
  game.collections = collections

  const rawPlaytime = Number(getProp(doc, 'Playtime') ?? 0)
  game.totalPlayTime = Number.isFinite(rawPlaytime) && rawPlaytime > 0 ? Math.round(rawPlaytime) : 0

  const rawPlayCount = Number(getProp(doc, 'PlayCount') ?? 0)
  game.playCount =
    Number.isFinite(rawPlayCount) && rawPlayCount > 0
      ? Math.trunc(rawPlayCount)
      : game.totalPlayTime > 0
        ? 1
        : 0

  game.lastLaunchedAt = normalizeIsoDateTime(getProp(doc, 'LastActivity'))
  game.addedAt = normalizeIsoDateTime(getProp(doc, 'Added'))

  if (game.totalPlayTime > 0) {
    const parsedLast = game.lastLaunchedAt ? Date.parse(game.lastLaunchedAt) : Number.NaN
    const parsedAdded = game.addedAt ? Date.parse(game.addedAt) : Number.NaN
    const endMs = Number.isFinite(parsedLast)
      ? parsedLast
      : Number.isFinite(parsedAdded)
        ? parsedAdded
        : Date.now()
    if (!game.lastLaunchedAt) {
      game.lastLaunchedAt = new Date(endMs).toISOString()
    }
    const startMs = Math.max(0, endMs - game.totalPlayTime * 1000)
    game.records.push({
      playDate: new Date(startMs).toISOString(),
      playTime: game.totalPlayTime,
    })
  }

  const rawScore = Number(getProp(doc, 'UserScore'))
  if (Number.isFinite(rawScore) && rawScore > 0) {
    game.rating = Math.max(0, Math.min(10, Math.round(rawScore / 10)))
  }

  const statusId = asTrimmedString(getProp(doc, 'CompletionStatusId')).toLowerCase()
  const inlineStatusObj = getProp(doc, 'CompletionStatus')
  const inlineStatusName =
    typeof inlineStatusObj === 'string'
      ? inlineStatusObj
      : inlineStatusObj && typeof inlineStatusObj === 'object'
        ? asTrimmedString(getProp(inlineStatusObj as Record<string, unknown>, 'Name'))
        : ''
  const statusName = lookups.completionStatuses.get(statusId) || inlineStatusName
  game.playStatus = mapPlayniteStatus(statusName, game.totalPlayTime)
  if (game.playStatus === 3 || game.playStatus === 4) {
    game.completedAt = game.lastLaunchedAt
  }

  game.exePath = resolvePlayniteExePath(doc)

  const rawLinks = getProp(doc, 'Links')
  if (Array.isArray(rawLinks)) {
    for (const rawLink of rawLinks) {
      if (!rawLink || typeof rawLink !== 'object') continue
      const linkObj = rawLink as Record<string, unknown>
      const linkName = asTrimmedString(getProp(linkObj, 'Name')) || 'Website'
      const url = asTrimmedString(getProp(linkObj, 'Url'))
      if (url) {
        game.websites.push({ name: linkName, url })
      }
    }
  }

  const externalIds = extractExternalIdsFromUrls(game.websites.map((item) => item.url))
  const pluginId = asTrimmedString(getProp(doc, 'PluginId')).toLowerCase()
  const extGameId = asTrimmedString(getProp(doc, 'GameId'))
  if (pluginId === STEAM_PLUGIN_ID && /^\d+$/.test(extGameId)) {
    if (!externalIds.some((item) => item.provider === 'steam' && item.externalId === extGameId)) {
      externalIds.push({ provider: 'steam', externalId: extGameId })
    }
  }
  game.externalIds = externalIds

  const cover = resolvePlayniteImageSource(getProp(doc, 'CoverImage'), mediaDirs)
  const bg = resolvePlayniteImageSource(getProp(doc, 'BackgroundImage'), mediaDirs)
  const icon = resolvePlayniteImageSource(getProp(doc, 'Icon'), mediaDirs)
  if (cover) game.images.cover = cover
  if (bg) game.images.bg = bg
  if (icon) game.images.icon = icon

  // 兼容带 inline 字符串数组格式（部分导出插件）
  if (game.platforms.length === 0) {
    game.platforms = asStringArray(getProp(doc, 'PlatformNames'))
  }

  return game
}

function parsePlayniteJsonPayload(rawJson: unknown): NormalizedImportGame[] {
  let rows: unknown[] = []
  if (Array.isArray(rawJson)) {
    rows = rawJson
  } else if (rawJson && typeof rawJson === 'object') {
    const obj = rawJson as Record<string, unknown>
    const nested = getProp(obj, 'Games', 'games', 'Items', 'items')
    if (Array.isArray(nested)) {
      rows = nested
    }
  }

  if (rows.length === 0) {
    throw new Error('Playnite JSON 中未找到有效的游戏数组（支持数组或 { Games: [...] }）')
  }

  const emptyLookups = {
    companies: new Map<string, string>(),
    platforms: new Map<string, string>(),
    tags: new Map<string, string>(),
    genres: new Map<string, string>(),
    categories: new Map<string, string>(),
    completionStatuses: new Map<string, string>(),
  }

  return rows
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((doc, idx) => mapPlayniteGameDoc(doc, idx, emptyLookups, []))
    .filter((item): item is NormalizedImportGame => item !== null)
}

async function parsePlayniteDatabaseDir(dbDir: string, mediaDirs: string[]) {
  const warnings: string[] = []
  const gamesDbPath = path.join(dbDir, 'games.db')
  const gamesRes = await readLiteDbCollection(gamesDbPath)
  warnings.push(...gamesRes.warnings)

  const [companies, platforms, tags, genres, categories, completionStatuses] = await Promise.all([
    readPlayniteLookupTable(path.join(dbDir, 'companies.db')),
    readPlayniteLookupTable(path.join(dbDir, 'platforms.db')),
    readPlayniteLookupTable(path.join(dbDir, 'tags.db')),
    readPlayniteLookupTable(path.join(dbDir, 'genres.db')),
    readPlayniteLookupTable(path.join(dbDir, 'categories.db')),
    readPlayniteLookupTable(path.join(dbDir, 'completionstatuses.db')),
  ])

  for (const res of [companies, platforms, tags, genres, categories, completionStatuses]) {
    warnings.push(...res.warnings)
  }

  const lookups = {
    companies: companies.map,
    platforms: platforms.map,
    tags: tags.map,
    genres: genres.map,
    categories: categories.map,
    completionStatuses: completionStatuses.map,
  }

  const games = gamesRes.documents
    .map((doc, idx) => mapPlayniteGameDoc(doc, idx, lookups, mediaDirs))
    .filter((item): item is NormalizedImportGame => item !== null)

  return { games, warnings }
}

export async function parsePlayniteImportData(
  input: PlayniteParserInput,
): Promise<ParsedPlatformData> {
  const warnings: string[] = []

  if (input.fileBuffer) {
    const ext = path.extname(input.fileName || '').toLowerCase()
    if (ext === '.json') {
      const parsed = JSON.parse(input.fileBuffer.toString('utf8')) as unknown
      return {
        platform: 'playnite',
        detectedFormat: 'Playnite JSON 导出文件',
        games: parsePlayniteJsonPayload(parsed),
        warnings,
      }
    }

    if (ext === '.db') {
      const res = await readLiteDbCollection(input.fileBuffer)
      const emptyLookups = {
        companies: new Map<string, string>(),
        platforms: new Map<string, string>(),
        tags: new Map<string, string>(),
        genres: new Map<string, string>(),
        categories: new Map<string, string>(),
        completionStatuses: new Map<string, string>(),
      }
      const games = res.documents
        .map((doc, idx) => mapPlayniteGameDoc(doc, idx, emptyLookups, []))
        .filter((item): item is NormalizedImportGame => item !== null)
      return {
        platform: 'playnite',
        detectedFormat: 'Playnite games.db（单文件）',
        games,
        warnings: res.warnings,
      }
    }

    if (ext !== '.zip') {
      throw new Error('Playnite 文件仅支持 .zip 备份包、.json 导出文件或 games.db')
    }

    await safeExtractZipToDir(input.fileBuffer, input.tempDir)
    const located = await findPlayniteRoot(input.tempDir)
    if (!located) {
      throw new Error('ZIP 备份包中未找到 library/games.db 或 games.db')
    }
    const { games, warnings: dbWarnings } = await parsePlayniteDatabaseDir(
      located.dbDir,
      located.mediaDirs,
    )
    return {
      platform: 'playnite',
      detectedFormat: 'Playnite 备份包（LiteDB v4）',
      games,
      warnings: dbWarnings,
      tempDir: input.tempDir,
    }
  }

  const localPath = (input.localPath || '').trim()
  if (!localPath) {
    throw new Error('请选择 Playnite 备份文件或数据目录')
  }

  if (!fs.existsSync(localPath)) {
    throw new Error(`路径不存在: ${localPath}`)
  }

  const stat = await fsp.stat(localPath)
  if (stat.isFile()) {
    const buf = await fsp.readFile(localPath)
    return parsePlayniteImportData({
      fileBuffer: buf,
      fileName: path.basename(localPath),
      tempDir: input.tempDir,
    })
  }

  const located = await findPlayniteRoot(localPath)
  if (!located) {
    throw new Error(
      '指定目录中未找到 Playnite 的 games.db（请指向 Playnite 数据目录或 library 目录）',
    )
  }

  const { games, warnings: dbWarnings } = await parsePlayniteDatabaseDir(
    located.dbDir,
    located.mediaDirs,
  )
  return {
    platform: 'playnite',
    detectedFormat: 'Playnite 本地数据库目录（LiteDB v4）',
    games,
    warnings: dbWarnings,
  }
}
