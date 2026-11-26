import fs from 'node:fs/promises'

const V7_PAGE_SIZE = 4096
const LITEDB_HEADER_INFO = '** This is a LiteDB file **'
const EMPTY_PAGE_ID = 0xffffffff

class ByteCursor {
  pos = 0

  constructor(private readonly buf: Buffer) {}

  get length() {
    return this.buf.length
  }

  ensure(bytes: number) {
    if (this.pos + bytes > this.buf.length) {
      throw new Error('LiteDB 数据页越界')
    }
  }

  skip(bytes: number) {
    this.ensure(bytes)
    this.pos += bytes
  }

  readByte(): number {
    this.ensure(1)
    return this.buf[this.pos++]
  }

  readBoolean(): boolean {
    return this.readByte() !== 0
  }

  readUInt16(): number {
    this.ensure(2)
    const value = this.buf.readUInt16LE(this.pos)
    this.pos += 2
    return value
  }

  readInt32(): number {
    this.ensure(4)
    const value = this.buf.readInt32LE(this.pos)
    this.pos += 4
    return value
  }

  readUInt32(): number {
    this.ensure(4)
    const value = this.buf.readUInt32LE(this.pos)
    this.pos += 4
    return value
  }

  readBigInt64(): bigint {
    this.ensure(8)
    const value = this.buf.readBigInt64LE(this.pos)
    this.pos += 8
    return value
  }

  readDouble(): number {
    this.ensure(8)
    const value = this.buf.readDoubleLE(this.pos)
    this.pos += 8
    return value
  }

  readBytes(count: number): Buffer {
    if (count < 0) {
      throw new Error('LiteDB 无效字节长度')
    }
    this.ensure(count)
    const slice = this.buf.subarray(this.pos, this.pos + count)
    this.pos += count
    return Buffer.from(slice)
  }

  /** 读取页元信息字符串（4字节无符号/有符号长度前缀，无末尾 \0） */
  readLengthPrefixedString(): string {
    const length = this.readInt32()
    if (length < 0 || length > this.buf.length - this.pos) {
      throw new Error('LiteDB 无效字符串长度')
    }
    const str = this.buf.toString('utf8', this.pos, this.pos + length)
    this.pos += length
    return str
  }

  /** 读取 BSON 字符串（4字节总长度含末尾 \0） */
  readBsonString(): string {
    const length = this.readInt32()
    if (length < 1 || length > this.buf.length - this.pos) {
      throw new Error('BSON 无效字符串长度')
    }
    const str = this.buf.toString('utf8', this.pos, this.pos + length - 1)
    this.pos += length
    return str
  }

  readCString(): string {
    const start = this.pos
    const zeroIdx = this.buf.indexOf(0x00, start)
    if (zeroIdx === -1) {
      throw new Error('BSON 键名缺少结束符')
    }
    const str = this.buf.toString('utf8', start, zeroIdx)
    this.pos = zeroIdx + 1
    return str
  }
}

function formatDotNetGuid(bytes: Buffer): string {
  const hex = (b: number) => b.toString(16).padStart(2, '0')
  const part1 = `${hex(bytes[3])}${hex(bytes[2])}${hex(bytes[1])}${hex(bytes[0])}`
  const part2 = `${hex(bytes[5])}${hex(bytes[4])}`
  const part3 = `${hex(bytes[7])}${hex(bytes[6])}`
  const part4 = `${hex(bytes[8])}${hex(bytes[9])}`
  const part5 = [
    hex(bytes[10]),
    hex(bytes[11]),
    hex(bytes[12]),
    hex(bytes[13]),
    hex(bytes[14]),
    hex(bytes[15]),
  ].join('')
  return `${part1}-${part2}-${part3}-${part4}-${part5}`
}

const MAX_DOTNET_MS = BigInt('253402300800000')
const MIN_DOTNET_MS = BigInt('-62135596800000')

function decodeDotNetDecimal(cursor: ByteCursor): number {
  const lo = BigInt(cursor.readUInt32())
  const mid = BigInt(cursor.readUInt32())
  const hi = BigInt(cursor.readUInt32())
  const flags = cursor.readUInt32()

  const negative = (flags & 0x80000000) !== 0
  const scale = (flags >>> 16) & 0xff
  const mantissa = (hi << BigInt(64)) | (mid << BigInt(32)) | lo
  const num = Number(mantissa) / 10 ** scale
  return negative ? -num : num
}

function readBsonDocument(cursor: ByteCursor): Record<string, unknown> {
  const docLength = cursor.readInt32()
  if (docLength < 5) {
    throw new Error('BSON 文档长度无效')
  }
  const endPos = cursor.pos + docLength - 5
  if (endPos >= cursor.length) {
    throw new Error('BSON 文档越界')
  }

  const result: Record<string, unknown> = {}
  while (cursor.pos < endPos) {
    const type = cursor.readByte()
    const key = cursor.readCString()
    result[key] = readBsonElement(cursor, type)
  }

  cursor.readByte() // trailing 0x00
  return result
}

function readBsonArray(cursor: ByteCursor): unknown[] {
  const doc = readBsonDocument(cursor)
  return Object.keys(doc)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => doc[key])
}

function readBsonElement(cursor: ByteCursor, type: number): unknown {
  switch (type) {
    case 0x01:
      return cursor.readDouble()
    case 0x02:
      return cursor.readBsonString()
    case 0x03:
      return readBsonDocument(cursor)
    case 0x04:
      return readBsonArray(cursor)
    case 0x05: {
      const length = cursor.readInt32()
      const subType = cursor.readByte()
      const bytes = cursor.readBytes(length)
      if ((subType === 0x04 || subType === 0x03) && length === 16) {
        return formatDotNetGuid(bytes)
      }
      return bytes
    }
    case 0x07:
      return cursor.readBytes(12).toString('hex')
    case 0x08:
      return cursor.readBoolean()
    case 0x09: {
      const ts = cursor.readBigInt64()
      if (ts === MAX_DOTNET_MS || ts === MIN_DOTNET_MS) {
        return null
      }
      const ms = Number(ts)
      if (!Number.isFinite(ms)) return null
      return new Date(ms).toISOString()
    }
    case 0x0a:
    case 0xff:
    case 0x7f:
      return null
    case 0x10:
      return cursor.readInt32()
    case 0x12: {
      const val = cursor.readBigInt64()
      return Number(val)
    }
    case 0x13:
      return decodeDotNetDecimal(cursor)
    default:
      throw new Error(`不支持的 BSON 类型: 0x${type.toString(16)}`)
  }
}

export function deserializeBsonDocument(buffer: Buffer): Record<string, unknown> {
  return readBsonDocument(new ByteCursor(buffer))
}

type PageHeader = {
  pageID: number
  pageType: number
  prevPageID: number
  nextPageID: number
  itemCount: number
}

function readPageSlice(dbBuffer: Buffer, pageID: number): Buffer | null {
  const offset = pageID * V7_PAGE_SIZE
  if (offset < 0 || offset + V7_PAGE_SIZE > dbBuffer.length) {
    return null
  }
  return dbBuffer.subarray(offset, offset + V7_PAGE_SIZE)
}

function readPageHeader(cursor: ByteCursor): PageHeader {
  const pageID = cursor.readUInt32()
  const pageType = cursor.readByte()
  const prevPageID = cursor.readUInt32()
  const nextPageID = cursor.readUInt32()
  const itemCount = cursor.readUInt16()
  cursor.skip(10) // freeBytes(2) + reserved(8)
  return { pageID, pageType, prevPageID, nextPageID, itemCount }
}

function parseHeaderPage(dbBuffer: Buffer) {
  const page0 = readPageSlice(dbBuffer, 0)
  if (!page0) {
    throw new Error('LiteDB 文件过小或为空')
  }

  // 检查是否为 LiteDB v5 (8192 页大小，offset 32 为魔数，offset 59 为 version=8)
  if (dbBuffer.length >= 64) {
    const v5Magic = dbBuffer.toString('ascii', 32, 59)
    if (v5Magic === LITEDB_HEADER_INFO && dbBuffer[59] === 8) {
      throw new Error('检测到 LiteDB v5 数据库文件，当前仅支持 Playnite 的 LiteDB v4 格式')
    }
  }

  const cursor = new ByteCursor(page0)
  const header = readPageHeader(cursor)
  if (header.pageType !== 1) {
    throw new Error('无效的 LiteDB 首页结构')
  }

  const info = page0.toString('ascii', cursor.pos, cursor.pos + 27)
  cursor.skip(27)
  const fileVersion = cursor.readByte()

  if (info !== LITEDB_HEADER_INFO) {
    throw new Error('不是有效的 LiteDB 数据库文件')
  }
  if (fileVersion === 8) {
    throw new Error('检测到 LiteDB v5 数据库文件，当前仅支持 Playnite 的 LiteDB v4 格式')
  }
  if (fileVersion !== 7) {
    throw new Error(`不支持的 LiteDB 文件版本: ${fileVersion}`)
  }

  cursor.skip(10) // ChangeID(2) + FreeEmptyPageID(4) + LastPageID(4)
  cursor.readUInt16() // userVersion
  cursor.skip(20) // password hash
  const salt = cursor.readBytes(16)
  if (salt.some((byte) => byte !== 0)) {
    throw new Error('LiteDB 数据库已加密，不支持读取')
  }

  const colCount = cursor.readByte()
  const collections = new Map<string, number>()
  for (let i = 0; i < colCount; i += 1) {
    const name = cursor.readLengthPrefixedString()
    const colPageID = cursor.readUInt32()
    collections.set(name, colPageID)
  }

  return collections
}

function readCollectionFirstIndexHead(dbBuffer: Buffer, colPageID: number): number | null {
  const pageBuf = readPageSlice(dbBuffer, colPageID)
  if (!pageBuf) return null
  const cursor = new ByteCursor(pageBuf)
  const header = readPageHeader(cursor)
  if (header.pageType !== 2) return null

  cursor.readLengthPrefixedString() // collectionName
  cursor.skip(12)

  for (let i = 0; i < 16; i += 1) {
    const field = cursor.readLengthPrefixedString()
    cursor.readBoolean() // unique
    const headPageID = cursor.readUInt32()
    cursor.skip(12) // headNode(2+6) + freeIndexPageID(4) -> wait: 2 + 6 + 4 = 12

    if (field.length > 0 && headPageID !== EMPTY_PAGE_ID) {
      return headPageID
    }
  }

  return null
}

function visitIndexPages(dbBuffer: Buffer, startPageID: number) {
  const queue: number[] = [startPageID]
  const visited = new Set<number>()
  const dataBlocks: Array<{ pageID: number; index: number }> = []

  while (queue.length > 0) {
    const pageID = queue.shift()!
    if (pageID === EMPTY_PAGE_ID || visited.has(pageID)) continue
    visited.add(pageID)

    const pageBuf = readPageSlice(dbBuffer, pageID)
    if (!pageBuf) continue

    const cursor = new ByteCursor(pageBuf)
    const header = readPageHeader(cursor)
    if (header.pageType !== 3) continue

    for (let i = 0; i < header.itemCount; i += 1) {
      cursor.readUInt16() // node index
      const levels = cursor.readByte()
      cursor.skip(13) // Slot(1) + PrevNode(6) + NextNode(6)
      const keyLength = cursor.readUInt16()
      cursor.skip(1 + keyLength) // DataType(1) + KeyValue

      const dataPageID = cursor.readUInt32()
      const dataIndex = cursor.readUInt16()
      const prevPageID = cursor.readUInt32()
      cursor.readUInt16() // prevIndex
      const nextPageID = cursor.readUInt32()
      cursor.readUInt16() // nextIndex

      if (levels > 1) {
        cursor.skip((levels - 1) * 12)
      }

      if (dataPageID !== EMPTY_PAGE_ID) {
        dataBlocks.push({ pageID: dataPageID, index: dataIndex })
      }
      if (prevPageID !== EMPTY_PAGE_ID && !visited.has(prevPageID)) {
        queue.push(prevPageID)
      }
      if (nextPageID !== EMPTY_PAGE_ID && !visited.has(nextPageID)) {
        queue.push(nextPageID)
      }
    }
  }

  return dataBlocks
}

function readExtendData(dbBuffer: Buffer, firstExtendPageID: number): Buffer {
  const chunks: Buffer[] = []
  const visited = new Set<number>()
  let current = firstExtendPageID

  while (current !== EMPTY_PAGE_ID && !visited.has(current)) {
    visited.add(current)
    const pageBuf = readPageSlice(dbBuffer, current)
    if (!pageBuf) return Buffer.alloc(0)

    const cursor = new ByteCursor(pageBuf)
    const header = readPageHeader(cursor)
    if (header.pageType !== 5) return Buffer.alloc(0)

    chunks.push(cursor.readBytes(header.itemCount))
    current = header.nextPageID
  }

  return Buffer.concat(chunks)
}

function readDataPageBlocks(dbBuffer: Buffer, pageID: number): Map<number, Buffer> {
  const result = new Map<number, Buffer>()
  const pageBuf = readPageSlice(dbBuffer, pageID)
  if (!pageBuf) return result

  const cursor = new ByteCursor(pageBuf)
  const header = readPageHeader(cursor)
  if (header.pageType !== 4) return result

  for (let i = 0; i < header.itemCount; i += 1) {
    const index = cursor.readUInt16()
    const extendPageID = cursor.readUInt32()
    const length = cursor.readUInt16()
    const rawData = cursor.readBytes(length)
    const fullData =
      extendPageID === EMPTY_PAGE_ID ? rawData : readExtendData(dbBuffer, extendPageID)
    result.set(index, fullData)
  }

  return result
}

export type LiteDbReadResult = {
  collectionNames: string[]
  documents: Record<string, unknown>[]
  warnings: string[]
}

export async function readLiteDbCollection(
  input: string | Buffer,
  targetCollection?: string,
): Promise<LiteDbReadResult> {
  const dbBuffer = typeof input === 'string' ? await fs.readFile(input) : input
  const collections = parseHeaderPage(dbBuffer)
  const collectionNames = Array.from(collections.keys())
  const warnings: string[] = []

  const selectedNames = targetCollection
    ? collections.has(targetCollection)
      ? [targetCollection]
      : []
    : collectionNames.filter((name) => !name.startsWith('_'))

  const documents: Record<string, unknown>[] = []
  const dataPageCache = new Map<number, Map<number, Buffer>>()

  for (const name of selectedNames) {
    const colPageID = collections.get(name)
    if (colPageID === undefined) continue

    const headPageID = readCollectionFirstIndexHead(dbBuffer, colPageID)
    if (headPageID === null) continue

    const blocks = visitIndexPages(dbBuffer, headPageID)
    const seenKeys = new Set<string>()

    for (const block of blocks) {
      const dedupeKey = `${block.pageID}:${block.index}`
      if (seenKeys.has(dedupeKey)) continue
      seenKeys.add(dedupeKey)

      let pageMap = dataPageCache.get(block.pageID)
      if (!pageMap) {
        pageMap = readDataPageBlocks(dbBuffer, block.pageID)
        dataPageCache.set(block.pageID, pageMap)
      }

      const rawDoc = pageMap.get(block.index)
      if (!rawDoc || rawDoc.length === 0) continue

      try {
        documents.push(deserializeBsonDocument(rawDoc))
      } catch (error) {
        warnings.push(`跳过损坏的 LiteDB 文档 (${name}@${dedupeKey}): ${(error as Error).message}`)
      }
    }
  }

  return {
    collectionNames,
    documents,
    warnings,
  }
}
