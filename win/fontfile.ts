import fs from 'node:fs/promises'
import path from 'node:path'

export type FontMetadata = {
  filePath: string
  fileName: string
  extension: string
  familyName: string
  fullName: string
  subfamily: string
  postScriptName: string
  style: string
  isBold: boolean
  isItalic: boolean
}

type NameRecord = {
  platformId: number
  languageId: number
  nameId: number
  text: string
}

const CHINESE_WINDOWS_LANGUAGE_IDS = new Set([
  0x0804, 0x0404, 0x0c04, 0x1404, 0x1004,
])

const CHINESE_MAC_LANGUAGE_IDS = new Set([19, 33])

const decodeUtf16BE = (bytes: Buffer): string => {
  if (bytes.length === 0) {
    return ''
  }

  const utf16le = Buffer.allocUnsafe(bytes.length)
  for (let index = 0; index < bytes.length - 1; index += 2) {
    utf16le[index] = bytes[index + 1]
    utf16le[index + 1] = bytes[index]
  }

  if (bytes.length % 2 === 1) {
    utf16le[bytes.length - 1] = bytes[bytes.length - 1]
  }

  return utf16le.toString('utf16le').replaceAll('\u0000', '').trim()
}

const decodeNameString = (
  buffer: Buffer,
  offset: number,
  length: number,
  platformId: number,
): string => {
  const bytes = buffer.subarray(offset, offset + length)

  if (platformId === 0 || platformId === 3) {
    return decodeUtf16BE(bytes)
  }

  return bytes.toString('latin1').replaceAll('\u0000', '').trim()
}

const getSfntOffset = (buffer: Buffer): number => {
  const signature = buffer.toString('ascii', 0, 4)
  if (signature !== 'ttcf') {
    return 0
  }

  if (buffer.length < 16) {
    throw new Error('无效字体文件：TTC 头长度不足')
  }

  return buffer.readUInt32BE(12)
}

const getTable = (
  buffer: Buffer,
  sfntOffset: number,
  tag: string,
): { offset: number; length: number } | null => {
  if (buffer.length < sfntOffset + 12) {
    return null
  }

  const numTables = buffer.readUInt16BE(sfntOffset + 4)
  const tableRecordStart = sfntOffset + 12

  for (let index = 0; index < numTables; index += 1) {
    const recordOffset = tableRecordStart + index * 16
    if (buffer.length < recordOffset + 16) {
      break
    }

    const tableTag = buffer.toString('ascii', recordOffset, recordOffset + 4)
    if (tableTag !== tag) {
      continue
    }

    const offset = buffer.readUInt32BE(recordOffset + 8)
    const length = buffer.readUInt32BE(recordOffset + 12)

    if (buffer.length < offset + length) {
      return null
    }

    return { offset, length }
  }

  return null
}

const parseNameRecords = (
  buffer: Buffer,
  nameTableOffset: number,
): NameRecord[] => {
  if (buffer.length < nameTableOffset + 6) {
    return []
  }

  const count = buffer.readUInt16BE(nameTableOffset + 2)
  const stringOffset = buffer.readUInt16BE(nameTableOffset + 4)
  const storageBase = nameTableOffset + stringOffset
  const records: NameRecord[] = []

  for (let index = 0; index < count; index += 1) {
    const recordOffset = nameTableOffset + 6 + index * 12
    if (buffer.length < recordOffset + 12) {
      break
    }

    const platformId = buffer.readUInt16BE(recordOffset)
    const languageId = buffer.readUInt16BE(recordOffset + 4)
    const nameId = buffer.readUInt16BE(recordOffset + 6)
    const length = buffer.readUInt16BE(recordOffset + 8)
    const offset = buffer.readUInt16BE(recordOffset + 10)

    const textOffset = storageBase + offset
    if (buffer.length < textOffset + length) {
      continue
    }

    const text = decodeNameString(buffer, textOffset, length, platformId)
    if (!text) {
      continue
    }

    records.push({
      platformId,
      languageId,
      nameId,
      text,
    })
  }

  return records
}

const isChineseRecord = (record: NameRecord): boolean => {
  if (record.platformId === 3) {
    return CHINESE_WINDOWS_LANGUAGE_IDS.has(record.languageId)
  }

  if (record.platformId === 1) {
    return CHINESE_MAC_LANGUAGE_IDS.has(record.languageId)
  }

  return false
}

const pickName = (
  records: NameRecord[],
  preferredNameIds: number[],
  fallback: string,
): string => {
  for (const nameId of preferredNameIds) {
    const scoped = records.filter((record) => record.nameId === nameId)

    const zh = scoped.find((record) => isChineseRecord(record))
    if (zh) {
      return zh.text
    }

    const englishUs = scoped.find(
      (record) => record.platformId === 3 && record.languageId === 0x0409,
    )
    if (englishUs) {
      return englishUs.text
    }

    if (scoped.length > 0) {
      return scoped[0].text
    }
  }

  return fallback
}

const inferStyle = (
  subfamily: string,
): { style: string; isBold: boolean; isItalic: boolean } => {
  const normalized = subfamily.toLowerCase()
  const isBold = normalized.includes('bold')
  const isItalic =
    normalized.includes('italic') || normalized.includes('oblique')

  if (!subfamily) {
    return {
      style: 'Regular',
      isBold: false,
      isItalic: false,
    }
  }

  return {
    style: subfamily,
    isBold,
    isItalic,
  }
}

// 获取字体文件的元数据，例如字体名称（如果有中文名，优先返回中文名）、样式等
export const getFontMetadata = async (
  fontfile: string,
): Promise<FontMetadata> => {
  const resolvedFontFile = path.resolve(fontfile)
  const extension = path.extname(resolvedFontFile).toLowerCase()

  const supported = new Set(['.ttf', '.otf', '.ttc'])
  if (!supported.has(extension)) {
    throw new Error(`不支持的字体文件类型: ${extension}`)
  }

  const buffer = await fs.readFile(resolvedFontFile)
  const sfntOffset = getSfntOffset(buffer)
  const nameTable = getTable(buffer, sfntOffset, 'name')

  if (!nameTable) {
    throw new Error('字体文件缺少 name 表，无法读取元数据')
  }

  const records = parseNameRecords(buffer, nameTable.offset)
  const fileName = path.basename(resolvedFontFile)
  const fallbackName = path.basename(fileName, extension)

  const familyName = pickName(records, [16, 1], fallbackName)
  const fullName = pickName(records, [4], familyName)
  const subfamily = pickName(records, [17, 2], 'Regular')
  const postScriptName = pickName(records, [6], fallbackName)
  const styleInfo = inferStyle(subfamily)

  return {
    filePath: resolvedFontFile,
    fileName,
    extension,
    familyName,
    fullName,
    subfamily,
    postScriptName,
    style: styleInfo.style,
    isBold: styleInfo.isBold,
    isItalic: styleInfo.isItalic,
  }
}

// 将电脑中的字体文件复制到项目的 public 目录下，并返回新的路径
export const copyFontFileToPublic = async (
  source: string,
  target: string,
): Promise<string> => {
  const resolvedSource = path.resolve(source)
  const projectRoot = process.cwd()
  const publicDir = path.join(projectRoot, 'public')

  const sourceStat = await fs.stat(resolvedSource).catch(() => null)
  if (!sourceStat || !sourceStat.isFile()) {
    throw new Error(`源字体文件不存在: ${resolvedSource}`)
  }

  const normalizedTarget = target.trim().replaceAll('\\', '/')
  const isTargetFile = path.extname(normalizedTarget) !== ''

  const absoluteTarget = path.isAbsolute(target)
    ? path.resolve(target)
    : path.resolve(publicDir, normalizedTarget)

  const finalTarget = isTargetFile
    ? absoluteTarget
    : path.join(absoluteTarget, path.basename(resolvedSource))

  const relativeToPublic = path.relative(publicDir, finalTarget)
  if (relativeToPublic.startsWith('..') || path.isAbsolute(relativeToPublic)) {
    throw new Error(
      'target 必须位于项目 public 目录内（可传相对 public 的路径）',
    )
  }

  await fs.mkdir(path.dirname(finalTarget), { recursive: true })
  await fs.copyFile(resolvedSource, finalTarget)

  return `/${relativeToPublic.split(path.sep).join('/')}`
}
