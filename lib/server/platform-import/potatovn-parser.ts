import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

import {
  createEmptyNormalizedGame,
  dedupeStringList,
  normalizeIsoDateOnly,
  normalizeIsoDateTime,
  safeExtractZipToDir,
  stripHtmlToText,
} from './types'

import type {
  NormalizedImageSource,
  NormalizedImportCharacter,
  NormalizedImportGame,
  ParsedPlatformData,
} from './types'

type PotatoVnParserInput = {
  fileBuffer?: Buffer
  fileName?: string
  localPath?: string
  tempDir: string
}

const PVN_PLAY_TYPE_MAP: Record<string, number> = {
  '0': 0,
  none: 0,
  '1': 1,
  playing: 1,
  '2': 3,
  played: 3,
  '3': 5,
  shelved: 5,
  '4': 5,
  abandoned: 5,
  '5': 0,
  wanttoplay: 0,
}

const PVN_RSS_PROVIDER_BY_INDEX: Array<{ idx: number; provider: string }> = [
  { idx: 0, provider: 'vndb' },
  { idx: 1, provider: 'bangumi' },
  { idx: 5, provider: 'ymgal' },
  { idx: 7, provider: 'steam' },
]

function unwrapLockable<T = unknown>(raw: unknown): T | undefined {
  if (raw !== null && raw !== undefined && typeof raw === 'object' && 'Value' in raw) {
    return (raw as { Value?: T }).Value
  }
  return raw as T | undefined
}

function cleanPvnText(raw: unknown): string {
  const val = unwrapLockable(raw)
  if (typeof val !== 'string') return ''
  const trimmed = val.trim()
  if (!trimmed || trimmed === '——' || trimmed.startsWith('ms-appx:///')) {
    return ''
  }
  return trimmed
}

function cleanPvnStringArray(raw: unknown): string[] {
  const val = unwrapLockable(raw)
  if (!Array.isArray(val)) return []
  return dedupeStringList(
    val
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item && item !== '——'),
  )
}

function parsePvnShortDate(rawKey: string): string {
  const trimmed = rawKey.trim()
  if (!trimmed) return ''

  const ymdMatch = /^(\d{4})[/-年](\d{1,2})[/-月](\d{1,2})日?/.exec(trimmed)
  if (ymdMatch) {
    const y = Number(ymdMatch[1])
    const m = Number(ymdMatch[2])
    const d = Number(ymdMatch[3])
    if (y >= 1970 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }

  const mdyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (mdyMatch) {
    const m = Number(mdyMatch[1])
    const d = Number(mdyMatch[2])
    const y = Number(mdyMatch[3])
    if (y >= 1970 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }

  return normalizeIsoDateOnly(trimmed)
}

function resolvePvnImageSource(
  rawValue: unknown,
  baseDirs: string[],
): NormalizedImageSource | undefined {
  const raw = cleanPvnText(rawValue)
  if (!raw) return undefined
  if (/^https?:\/\//i.test(raw)) {
    return { kind: 'url', url: raw }
  }

  const normalizedRel = raw
    .replace(/^\.[\\/]/, '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')

  for (const baseDir of baseDirs) {
    const resolvedRoot = path.resolve(baseDir)
    const candidate = path.resolve(resolvedRoot, ...normalizedRel.split('/').filter(Boolean))
    if (
      (candidate === resolvedRoot || candidate.startsWith(resolvedRoot + path.sep)) &&
      fs.existsSync(candidate) &&
      fs.statSync(candidate).isFile()
    ) {
      return { kind: 'file', filePath: candidate }
    }
  }

  if (
    path.isAbsolute(raw) &&
    fs.existsSync(/*turbopackIgnore: true*/ raw) &&
    fs.statSync(/*turbopackIgnore: true*/ raw).isFile()
  ) {
    return { kind: 'file', filePath: raw }
  }

  return undefined
}

function parseFirstInt(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw)
  if (typeof raw !== 'string') return null
  const matched = /\d+/.exec(raw)
  return matched ? Number(matched[0]) : null
}

function parseBwh(raw: unknown): {
  bust: number | null
  waist: number | null
  hips: number | null
} {
  if (typeof raw !== 'string') return { bust: null, waist: null, hips: null }
  const matched = /(\d+)\s*[/\-\\]\s*(\d+)\s*[/\-\\]\s*(\d+)/.exec(raw)
  if (!matched) return { bust: null, waist: null, hips: null }
  return {
    bust: Number(matched[1]),
    waist: Number(matched[2]),
    hips: Number(matched[3]),
  }
}

function mapPvnGender(raw: unknown): string {
  if (raw === 1 || String(raw).toLowerCase() === 'male') return JSON.stringify(['m', 'm'])
  if (raw === 2 || String(raw).toLowerCase() === 'female') return JSON.stringify(['f', 'f'])
  return ''
}

function mapPvnCharacters(
  rawCharacters: unknown,
  gameUuid: string,
  baseDirs: string[],
): NormalizedImportCharacter[] {
  if (!Array.isArray(rawCharacters)) return []
  const result: NormalizedImportCharacter[] = []

  rawCharacters.forEach((rawChar, idx) => {
    if (!rawChar || typeof rawChar !== 'object') return
    const ch = rawChar as Record<string, unknown>
    const name = typeof ch.Name === 'string' ? ch.Name.trim() : ''
    if (!name) return

    const ids = Array.isArray(ch.Ids) ? ch.Ids : []
    const rawVndbId = typeof ids[0] === 'string' ? ids[0].trim().toLowerCase() : ''
    const vndbId = rawVndbId
      ? /^\d+$/.test(rawVndbId)
        ? `v${rawVndbId}`
        : rawVndbId
      : `pvn:${gameUuid}:${idx}`

    const bwh = parseBwh(ch.BWH)
    const imageSource =
      resolvePvnImageSource(ch.ImagePath, baseDirs) ??
      resolvePvnImageSource(ch.PreviewImagePath, baseDirs)

    const birthMonth = typeof ch.BirthMon === 'number' ? ch.BirthMon : null
    const birthDay = typeof ch.BirthDay === 'number' ? ch.BirthDay : null
    const gender = mapPvnGender(ch.Gender)

    result.push({
      vndbId,
      name,
      original: '',
      description: stripHtmlToText(typeof ch.Summary === 'string' ? ch.Summary : ''),
      bloodType: typeof ch.BloodType === 'string' ? ch.BloodType.trim() : '',
      height: parseFirstInt(ch.Height),
      weight: parseFirstInt(ch.Weight),
      bust: bwh.bust,
      waist: bwh.waist,
      hips: bwh.hips,
      age: null,
      birthdayMonth: birthMonth,
      birthdayDay: birthDay,
      sex: gender,
      gender,
      imageSource,
    })
  })

  return result
}

function extractPvnExePath(rawGame: Record<string, unknown>): string {
  const direct = cleanPvnText(rawGame.ExePath)
  if (direct) return direct

  const preferredId =
    typeof rawGame.PreferredInstallationId === 'string'
      ? rawGame.PreferredInstallationId.toLowerCase()
      : ''
  const entries = Array.isArray(rawGame.SourceEntries) ? rawGame.SourceEntries : []

  let fallbackExe = ''
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    const localConfig = e.LocalConfig as Record<string, unknown> | undefined
    const exePath = typeof localConfig?.ExePath === 'string' ? localConfig.ExePath.trim() : ''
    if (!exePath) continue
    const entryId = typeof e.EntryId === 'string' ? e.EntryId.toLowerCase() : ''
    if (preferredId && entryId === preferredId) return exePath
    if (!fallbackExe) fallbackExe = exePath
  }

  return fallbackExe
}

function extractPvnSaveDir(rawGame: Record<string, unknown>): string {
  const savePos = cleanPvnText(rawGame.SavePosition)
  if (savePos) return savePos
  const detected = cleanPvnText(rawGame.DetectedSavePosition)
  if (detected) return detected

  const entries = Array.isArray(rawGame.SourceEntries) ? rawGame.SourceEntries : []
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue
    const localConfig = (entry as Record<string, unknown>).LocalConfig as
      | Record<string, unknown>
      | undefined
    const savePath = typeof localConfig?.SavePath === 'string' ? localConfig.SavePath.trim() : ''
    if (savePath) return savePath
  }
  return ''
}

function mapPvnGame(
  rawGame: Record<string, unknown>,
  index: number,
  options: {
    baseDirs: string[]
    collectionsByUuid: Map<string, string[]>
    staffByUuid: Map<
      string,
      { script: string[]; music: string[]; originalPainter: string[]; programmer: string[] }
    >
  },
): NormalizedImportGame | null {
  const rawName = cleanPvnText(rawGame.Name)
  const originalName = cleanPvnText(rawGame.OriginalName)
  const chineseName = cleanPvnText(rawGame.ChineseName) || cleanPvnText(rawGame.CnName)

  const name = originalName || rawName || chineseName
  const nameCn = chineseName || rawName || originalName
  if (!name && !nameCn) return null

  const uuid =
    typeof rawGame.Uuid === 'string' && rawGame.Uuid.trim()
      ? rawGame.Uuid.trim()
      : `pvn_${index + 1}`

  const game = createEmptyNormalizedGame(uuid)
  game.name = name
  game.nameCn = nameCn
  game.date = normalizeIsoDateOnly(unwrapLockable(rawGame.ReleaseDate))
  game.summary = stripHtmlToText(cleanPvnText(rawGame.Description))
  game.developer = cleanPvnText(rawGame.Developer)
  game.gameEngine = cleanPvnText(rawGame.Engine)
  game.tags = cleanPvnStringArray(rawGame.Tags)
  game.exePath = extractPvnExePath(rawGame)
  game.saveDir = extractPvnSaveDir(rawGame)
  game.addedAt = normalizeIsoDateTime(rawGame.AddTime)
  game.lastLaunchedAt = normalizeIsoDateTime(rawGame.LastPlayTime)

  const rawTotalMinutes = Number(unwrapLockable(rawGame.TotalPlayTime) ?? 0)
  let totalSeconds =
    Number.isFinite(rawTotalMinutes) && rawTotalMinutes > 0 ? Math.round(rawTotalMinutes * 60) : 0

  const playedTimeMap = rawGame.PlayedTime as Record<string, unknown> | undefined
  if (playedTimeMap && typeof playedTimeMap === 'object') {
    for (const [dateKey, rawMinutes] of Object.entries(playedTimeMap)) {
      const dateOnly = parsePvnShortDate(dateKey)
      const mins = Number(rawMinutes)
      if (dateOnly && Number.isFinite(mins) && mins > 0) {
        game.records.push({
          playDate: `${dateOnly}T12:00:00.000Z`,
          playTime: Math.round(mins * 60),
        })
      }
    }
  }

  if (totalSeconds === 0 && game.records.length > 0) {
    totalSeconds = game.records.reduce((sum, item) => sum + item.playTime, 0)
  }
  game.totalPlayTime = totalSeconds

  const rawPlayCount = Number(rawGame.PlayCount ?? 0)
  game.playCount =
    Number.isFinite(rawPlayCount) && rawPlayCount > 0
      ? Math.trunc(rawPlayCount)
      : game.records.length || (totalSeconds > 0 ? 1 : 0)

  const myRate = Number(rawGame.MyRate ?? 0)
  const fallbackRating = Number(unwrapLockable(rawGame.Rating) ?? 0)
  const score = Number.isFinite(myRate) && myRate > 0 ? myRate : fallbackRating
  if (Number.isFinite(score) && score > 0) {
    game.rating = Math.max(0, Math.min(10, Math.round(score)))
  }

  const playTypeKey = String(rawGame.PlayType ?? '')
    .trim()
    .toLowerCase()
  game.playStatus = PVN_PLAY_TYPE_MAP[playTypeKey] ?? (totalSeconds > 0 ? 1 : 0)
  if (game.playStatus === 3 || game.playStatus === 4) {
    game.completedAt = game.lastLaunchedAt
  }

  const ids = Array.isArray(rawGame.Ids) ? rawGame.Ids : []
  const externalIds = []
  for (const mapping of PVN_RSS_PROVIDER_BY_INDEX) {
    const rawVal = typeof ids[mapping.idx] === 'string' ? ids[mapping.idx].trim() : ''
    if (!rawVal) continue
    let externalId = rawVal
    if (mapping.provider === 'vndb') {
      externalId = rawVal.toLowerCase()
      if (/^\d+$/.test(externalId)) externalId = `v${externalId}`
    } else if (mapping.provider === 'ymgal') {
      externalId = rawVal.replace(/^[gG][aA]/, '')
    }
    externalIds.push({ provider: mapping.provider, externalId })
  }
  game.externalIds = externalIds

  const cover = resolvePvnImageSource(rawGame.ImagePath, options.baseDirs)
  const bg = resolvePvnImageSource(rawGame.HeaderImagePath, options.baseDirs)
  if (cover) game.images.cover = cover
  if (bg) game.images.bg = bg

  const uuidLower = uuid.toLowerCase()
  game.collections = dedupeStringList(options.collectionsByUuid.get(uuidLower) ?? [])
  game.characters = mapPvnCharacters(rawGame.Characters, uuid, options.baseDirs)

  const staff = options.staffByUuid.get(uuidLower)
  if (staff) {
    game.script = dedupeStringList(staff.script).join(', ')
    game.music = dedupeStringList(staff.music).join(', ')
    game.originalPainter = dedupeStringList(staff.originalPainter).join(', ')
    game.programmer = dedupeStringList(staff.programmer).join(', ')
  }

  return game
}

async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  if (!fs.existsSync(filePath)) return null
  const text = await fsp.readFile(filePath, 'utf8')
  return JSON.parse(text) as T
}

function buildCollectionsMap(rawGroups: unknown): Map<string, string[]> {
  const result = new Map<string, string[]>()
  if (!Array.isArray(rawGroups)) return result

  for (const rawGroup of rawGroups) {
    if (!rawGroup || typeof rawGroup !== 'object') continue
    const group = rawGroup as Record<string, unknown>
    const typeVal = group.Type
    const isCustom = typeVal === 2 || String(typeVal).toLowerCase() === 'custom'
    if (!isCustom) continue

    const categories = Array.isArray(group.Categories) ? group.Categories : []
    for (const rawCategory of categories) {
      if (!rawCategory || typeof rawCategory !== 'object') continue
      const category = rawCategory as Record<string, unknown>
      const catName = typeof category.Name === 'string' ? category.Name.trim() : ''
      if (!catName) continue

      const ids = Array.isArray(category.GalgameIds)
        ? category.GalgameIds
        : Array.isArray(category._galgameIds)
          ? category._galgameIds
          : []
      for (const rawId of ids) {
        if (typeof rawId !== 'string' || !rawId.trim()) continue
        const key = rawId.trim().toLowerCase()
        const list = result.get(key) ?? []
        list.push(catName)
        result.set(key, list)
      }
    }
  }

  return result
}

function buildStaffMap(
  rawStaffs: unknown,
): Map<
  string,
  { script: string[]; music: string[]; originalPainter: string[]; programmer: string[] }
> {
  const result = new Map<
    string,
    { script: string[]; music: string[]; originalPainter: string[]; programmer: string[] }
  >()
  if (!Array.isArray(rawStaffs)) return result

  for (const rawStaff of rawStaffs) {
    if (!rawStaff || typeof rawStaff !== 'object') continue
    const staff = rawStaff as Record<string, unknown>
    const staffName =
      cleanPvnText(staff.ChineseName) ||
      cleanPvnText(staff.JapaneseName) ||
      cleanPvnText(staff.EnglishName) ||
      cleanPvnText(staff.Name)
    if (!staffName) continue

    const games = Array.isArray(staff.Games) ? staff.Games : []
    for (const rawStaffGame of games) {
      if (!rawStaffGame || typeof rawStaffGame !== 'object') continue
      const sg = rawStaffGame as Record<string, unknown>
      const gameId =
        typeof sg.GameId === 'string'
          ? sg.GameId.trim().toLowerCase()
          : typeof sg.LoadedGameId === 'string'
            ? sg.LoadedGameId.trim().toLowerCase()
            : ''
      if (!gameId) continue

      const bucket = result.get(gameId) ?? {
        script: [],
        music: [],
        originalPainter: [],
        programmer: [],
      }

      const relations = Array.isArray(sg.Relation) ? sg.Relation : []
      for (const rel of relations) {
        const key = String(rel).toLowerCase()
        if (key === '1' || key === 'writer') bucket.script.push(staffName)
        else if (key === '2' || key === 'painter') bucket.originalPainter.push(staffName)
        else if (key === '3' || key === 'musician') bucket.music.push(staffName)
        else if (key === '6' || key === 'programmer') bucket.programmer.push(staffName)
      }

      result.set(gameId, bucket)
    }
  }

  return result
}

async function locatePotatoVnExportDir(rootDir: string): Promise<string | null> {
  if (fs.existsSync(path.join(rootDir, 'data.galgames.json'))) {
    return rootDir
  }
  const entries = await fsp.readdir(rootDir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const sub = path.join(rootDir, entry.name)
    if (fs.existsSync(path.join(sub, 'data.galgames.json'))) {
      return sub
    }
  }
  return null
}

async function parsePotatoVnExportDir(exportDir: string): Promise<ParsedPlatformData> {
  const warnings: string[] = []
  const rawGalgames = await readJsonSafe<unknown>(path.join(exportDir, 'data.galgames.json'))
  if (!Array.isArray(rawGalgames)) {
    throw new Error('data.galgames.json 格式无效，未找到游戏数组')
  }

  const rawCategories = await readJsonSafe<unknown>(
    path.join(exportDir, 'data.categoryGroups.json'),
  ).catch(() => null)
  const rawStaffs = await readJsonSafe<unknown>(path.join(exportDir, 'data.staff.json')).catch(
    () => null,
  )

  const collectionsByUuid = buildCollectionsMap(rawCategories)
  const staffByUuid = buildStaffMap(rawStaffs)

  const games = rawGalgames
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((doc, idx) =>
      mapPvnGame(doc, idx, {
        baseDirs: [exportDir],
        collectionsByUuid,
        staffByUuid,
      }),
    )
    .filter((item): item is NormalizedImportGame => item !== null)

  return {
    platform: 'potatovn',
    detectedFormat: 'PotatoVN 导出包（.pvnExport.zip / JSON）',
    games,
    warnings,
  }
}

const PVN_DB_HELP_ERROR =
  '检测到 PotatoVN 本地数据库（pvn_data.db），请在 PotatoVN 的「设置 → 其他设置」中点击「导出数据」生成 .pvnExport.zip 文件后再导入。'

async function collectMetaBackupFiles(dir: string): Promise<string[]> {
  const found: string[] = []
  const dotPvn = path.join(dir, '.PotatoVN')
  const candidateDirs = fs.existsSync(dotPvn) ? [dotPvn] : [dir]

  const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDot = path.join(dir, entry.name, '.PotatoVN')
      if (fs.existsSync(subDot)) candidateDirs.push(subDot)
    }
  }

  for (const targetDir of candidateDirs) {
    const files = await fsp.readdir(targetDir, { withFileTypes: true }).catch(() => [])
    for (const file of files) {
      if (file.isFile() && file.name.toLowerCase().endsWith('.json')) {
        found.push(path.join(targetDir, file.name))
      }
    }
  }

  return found
}

export async function parsePotatoVnImportData(
  input: PotatoVnParserInput,
): Promise<ParsedPlatformData> {
  if (input.fileBuffer) {
    const lowerName = (input.fileName || '').toLowerCase()
    if (lowerName.endsWith('.db')) {
      throw new Error(PVN_DB_HELP_ERROR)
    }

    if (lowerName.endsWith('.json')) {
      const parsed = JSON.parse(input.fileBuffer.toString('utf8')) as unknown
      if (Array.isArray(parsed)) {
        const games = parsed
          .filter((item): item is Record<string, unknown> =>
            Boolean(item && typeof item === 'object'),
          )
          .map((doc, idx) =>
            mapPvnGame(doc, idx, {
              baseDirs: [],
              collectionsByUuid: new Map(),
              staffByUuid: new Map(),
            }),
          )
          .filter((item): item is NormalizedImportGame => item !== null)

        return {
          platform: 'potatovn',
          detectedFormat: 'PotatoVN data.galgames.json',
          games,
          warnings: [],
        }
      }

      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>
        const gamePayload =
          obj.Game && typeof obj.Game === 'object' ? (obj.Game as Record<string, unknown>) : obj
        const mapped = mapPvnGame(gamePayload, 0, {
          baseDirs: [],
          collectionsByUuid: new Map(),
          staffByUuid: new Map(),
        })
        if (!mapped) {
          throw new Error('JSON 中未找到有效的 PotatoVN 游戏数据')
        }
        return {
          platform: 'potatovn',
          detectedFormat: 'PotatoVN 单游戏元数据 JSON',
          games: [mapped],
          warnings: [],
        }
      }

      throw new Error('PotatoVN JSON 格式无效')
    }

    if (!lowerName.endsWith('.zip')) {
      throw new Error('PotatoVN 文件仅支持 .pvnExport.zip / .zip 导出包或 .json 文件')
    }

    await safeExtractZipToDir(input.fileBuffer, input.tempDir)
    const exportDir = await locatePotatoVnExportDir(input.tempDir)
    if (!exportDir) {
      if (fs.existsSync(path.join(input.tempDir, 'pvn_data.db'))) {
        throw new Error(PVN_DB_HELP_ERROR)
      }
      throw new Error(
        'ZIP 中未找到 data.galgames.json，请确认上传的是 PotatoVN 导出的 .pvnExport.zip',
      )
    }

    const result = await parsePotatoVnExportDir(exportDir)
    return { ...result, tempDir: input.tempDir }
  }

  const localPath = (input.localPath || '').trim()
  if (!localPath) {
    throw new Error('请选择 PotatoVN 导出包或数据目录')
  }
  if (!fs.existsSync(localPath)) {
    throw new Error(`路径不存在: ${localPath}`)
  }

  const stat = await fsp.stat(localPath)
  if (stat.isFile()) {
    const buf = await fsp.readFile(localPath)
    return parsePotatoVnImportData({
      fileBuffer: buf,
      fileName: path.basename(localPath),
      tempDir: input.tempDir,
    })
  }

  const exportDir = await locatePotatoVnExportDir(localPath)
  if (exportDir) {
    return parsePotatoVnExportDir(exportDir)
  }

  if (fs.existsSync(path.join(localPath, 'pvn_data.db'))) {
    throw new Error(PVN_DB_HELP_ERROR)
  }

  const metaFiles = await collectMetaBackupFiles(localPath)
  const games: NormalizedImportGame[] = []
  for (const filePath of metaFiles) {
    const json = await readJsonSafe<Record<string, unknown>>(filePath).catch(() => null)
    if (!json || typeof json !== 'object') continue
    const gamePayload =
      json.Game && typeof json.Game === 'object' ? (json.Game as Record<string, unknown>) : json
    const baseDir = path.dirname(filePath)
    const mapped = mapPvnGame(gamePayload, games.length, {
      baseDirs: [baseDir, path.dirname(baseDir)],
      collectionsByUuid: new Map(),
      staffByUuid: new Map(),
    })
    if (mapped) games.push(mapped)
  }

  if (games.length > 0) {
    return {
      platform: 'potatovn',
      detectedFormat: 'PotatoVN .PotatoVN 元数据目录',
      games,
      warnings: [],
    }
  }

  throw new Error('指定目录中未找到 data.galgames.json 或 .PotatoVN 元数据')
}
