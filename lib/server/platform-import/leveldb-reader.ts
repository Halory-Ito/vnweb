import fs from 'node:fs/promises'
import path from 'node:path'

const LOG_BLOCK_SIZE = 32768
const LOG_HEADER_SIZE = 7
const SSTABLE_FOOTER_SIZE = 48
const SSTABLE_MAGIC = Buffer.from([0x57, 0xfb, 0x80, 0x8b, 0x24, 0x75, 0x47, 0xdb])

function readVarint32(buf: Buffer, offset: number): { value: number; next: number } {
  let result = 0
  let shift = 0
  let pos = offset

  while (pos < buf.length && shift < 35) {
    const byte = buf[pos++]
    result |= (byte & 0x7f) << shift
    if ((byte & 0x80) === 0) {
      return { value: result >>> 0, next: pos }
    }
    shift += 7
  }
  throw new Error('Snappy/LevelDB varint32 解析失败')
}

function readVarint64(buf: Buffer, offset: number): { value: bigint; next: number } {
  let result = BigInt(0)
  let shift = BigInt(0)
  let pos = offset

  while (pos < buf.length && shift < BigInt(70)) {
    const byte = buf[pos++]
    result |= BigInt(byte & 0x7f) << shift
    if ((byte & 0x80) === 0) {
      return { value: result, next: pos }
    }
    shift += BigInt(7)
  }
  throw new Error('LevelDB varint64 解析失败')
}

function readLengthPrefixedSlice(buf: Buffer, offset: number): { data: Buffer; next: number } {
  const { value: len, next } = readVarint32(buf, offset)
  if (next + len > buf.length) {
    throw new Error('LevelDB slice 长度越界')
  }
  return {
    data: buf.subarray(next, next + len),
    next: next + len,
  }
}

export function snappyUncompress(input: Buffer): Buffer {
  if (input.length === 0) return Buffer.alloc(0)

  const { value: uncompressedLen, next: startPos } = readVarint32(input, 0)
  const output = Buffer.allocUnsafe(uncompressedLen)
  let src = startPos
  let dst = 0

  while (src < input.length) {
    const tag = input[src++]
    const type = tag & 0x03

    if (type === 0) {
      let length = (tag >>> 2) + 1
      if (length > 60) {
        const extraBytes = length - 60
        if (src + extraBytes > input.length) {
          throw new Error('Snappy literal 长度越界')
        }
        let extra = 0
        for (let i = 0; i < extraBytes; i += 1) {
          extra |= input[src++] << (8 * i)
        }
        length = extra + 1
      }
      if (src + length > input.length || dst + length > output.length) {
        throw new Error('Snappy literal 数据越界')
      }
      input.copy(output, dst, src, src + length)
      src += length
      dst += length
      continue
    }

    let length = 0
    let offset = 0

    if (type === 1) {
      if (src >= input.length) throw new Error('Snappy copy-1 越界')
      length = ((tag >>> 2) & 0x07) + 4
      offset = ((tag & 0xe0) << 3) | input[src++]
    } else if (type === 2) {
      if (src + 2 > input.length) throw new Error('Snappy copy-2 越界')
      length = (tag >>> 2) + 1
      offset = input.readUInt16LE(src)
      src += 2
    } else {
      if (src + 4 > input.length) throw new Error('Snappy copy-4 越界')
      length = (tag >>> 2) + 1
      offset = input.readUInt32LE(src)
      src += 4
    }

    if (offset <= 0 || offset > dst || dst + length > output.length) {
      throw new Error('Snappy copy 偏移越界')
    }

    for (let i = 0; i < length; i += 1) {
      output[dst] = output[dst - offset]
      dst += 1
    }
  }

  if (dst !== uncompressedLen) {
    throw new Error('Snappy 解压长度不匹配')
  }
  return output
}

export function readLevelDbLogRecords(buf: Buffer): Buffer[] {
  const records: Buffer[] = []
  let fragments: Buffer[] = []
  let pos = 0

  while (pos < buf.length) {
    const offsetInBlock = pos % LOG_BLOCK_SIZE
    const blockRemaining = LOG_BLOCK_SIZE - offsetInBlock

    if (blockRemaining < LOG_HEADER_SIZE) {
      pos += blockRemaining
      continue
    }

    const length = buf.readUInt16LE(pos + 4)
    const recordType = buf[pos + 6]

    if (recordType === 0) {
      // 0-padding or preallocated zero block
      const allZero = buf.readUInt32LE(pos) === 0 && length === 0
      if (allZero) {
        pos += blockRemaining
        continue
      }
      break
    }

    if (pos + LOG_HEADER_SIZE + length > buf.length) {
      break
    }

    const payload = buf.subarray(pos + LOG_HEADER_SIZE, pos + LOG_HEADER_SIZE + length)
    pos += LOG_HEADER_SIZE + length

    if (recordType === 1) {
      fragments = []
      records.push(Buffer.from(payload))
    } else if (recordType === 2) {
      fragments = [Buffer.from(payload)]
    } else if (recordType === 3) {
      if (fragments.length > 0) fragments.push(Buffer.from(payload))
    } else if (recordType === 4) {
      if (fragments.length > 0) {
        fragments.push(Buffer.from(payload))
        records.push(Buffer.concat(fragments))
        fragments = []
      }
    }
  }

  return records
}

type ManifestState = {
  activeFiles: Set<number>
  logNumber: number
  hasManifest: boolean
}

async function readManifestState(dbDir: string): Promise<ManifestState> {
  const activeFiles = new Set<number>()
  let logNumber = 0

  try {
    const currentName = (await fs.readFile(path.join(dbDir, 'CURRENT'), 'utf8')).trim()
    if (!currentName) return { activeFiles, logNumber, hasManifest: false }

    const manifestBuf = await fs.readFile(path.join(dbDir, currentName))
    const records = readLevelDbLogRecords(manifestBuf)

    for (const record of records) {
      let pos = 0
      while (pos < record.length) {
        const { value: tag, next: afterTag } = readVarint32(record, pos)
        pos = afterTag

        switch (tag) {
          case 1: {
            const { next } = readLengthPrefixedSlice(record, pos)
            pos = next
            break
          }
          case 2: {
            const { value, next } = readVarint64(record, pos)
            logNumber = Number(value)
            pos = next
            break
          }
          case 3:
          case 4:
          case 9: {
            const { next } = readVarint64(record, pos)
            pos = next
            break
          }
          case 5: {
            const { next: afterLevel } = readVarint32(record, pos)
            const { next } = readLengthPrefixedSlice(record, afterLevel)
            pos = next
            break
          }
          case 6: {
            const { next: afterLevel } = readVarint32(record, pos)
            const { value: fileNumber, next } = readVarint64(record, afterLevel)
            activeFiles.delete(Number(fileNumber))
            pos = next
            break
          }
          case 7: {
            const { next: afterLevel } = readVarint32(record, pos)
            const { value: fileNumber, next: afterNum } = readVarint64(record, afterLevel)
            const { next: afterSize } = readVarint64(record, afterNum)
            const { next: afterMin } = readLengthPrefixedSlice(record, afterSize)
            const { next: afterMax } = readLengthPrefixedSlice(record, afterMin)
            activeFiles.add(Number(fileNumber))
            pos = afterMax
            break
          }
          default:
            pos = record.length
            break
        }
      }
    }

    return { activeFiles, logNumber, hasManifest: true }
  } catch {
    return { activeFiles: new Set<number>(), logNumber: 0, hasManifest: false }
  }
}

type LevelDbEntry = {
  userKey: Buffer
  seq: bigint
  type: number
  value: Buffer
}

function readBlockHandle(buf: Buffer, offset: number) {
  const { value: blockOffset, next: afterOffset } = readVarint64(buf, offset)
  const { value: blockSize, next } = readVarint64(buf, afterOffset)
  return {
    offset: Number(blockOffset),
    size: Number(blockSize),
    next,
  }
}

function decodeTableBlock(fileBuf: Buffer, offset: number, size: number): Buffer {
  if (offset + size + 5 > fileBuf.length) {
    throw new Error('SSTable block 越界')
  }
  const raw = fileBuf.subarray(offset, offset + size)
  const compressionType = fileBuf[offset + size]

  if (compressionType === 0) {
    return Buffer.from(raw)
  }
  if (compressionType === 1) {
    return snappyUncompress(raw)
  }
  throw new Error(`不支持的 SSTable 压缩类型: ${compressionType}`)
}

function parseBlockEntries(block: Buffer): Array<{ key: Buffer; value: Buffer }> {
  if (block.length < 4) return []
  const numRestarts = block.readUInt32LE(block.length - 4)
  const entriesEnd = block.length - 4 - numRestarts * 4
  if (entriesEnd < 0) return []

  const entries: Array<{ key: Buffer; value: Buffer }> = []
  let prevKey = Buffer.alloc(0)
  let pos = 0

  while (pos < entriesEnd) {
    const { value: shared, next: p1 } = readVarint32(block, pos)
    const { value: nonShared, next: p2 } = readVarint32(block, p1)
    const { value: valueLen, next: p3 } = readVarint32(block, p2)
    pos = p3

    if (pos + nonShared + valueLen > entriesEnd) break

    const deltaKey = block.subarray(pos, pos + nonShared)
    pos += nonShared
    const value = Buffer.from(block.subarray(pos, pos + valueLen))
    pos += valueLen

    const fullKey = Buffer.concat([prevKey.subarray(0, shared), deltaKey])
    prevKey = fullKey
    entries.push({ key: fullKey, value })
  }

  return entries
}

async function readSstableEntries(filePath: string): Promise<LevelDbEntry[]> {
  const fileBuf = await fs.readFile(filePath)
  if (fileBuf.length < SSTABLE_FOOTER_SIZE) return []

  const footerStart = fileBuf.length - SSTABLE_FOOTER_SIZE
  const magic = fileBuf.subarray(footerStart + 40, footerStart + 48)
  if (!magic.equals(SSTABLE_MAGIC)) {
    return []
  }

  const metaHandle = readBlockHandle(fileBuf, footerStart)
  const indexHandle = readBlockHandle(fileBuf, metaHandle.next)

  const indexBlock = decodeTableBlock(fileBuf, indexHandle.offset, indexHandle.size)
  const indexEntries = parseBlockEntries(indexBlock)
  const results: LevelDbEntry[] = []

  for (const indexEntry of indexEntries) {
    const dataHandle = readBlockHandle(indexEntry.value, 0)
    const dataBlock = decodeTableBlock(fileBuf, dataHandle.offset, dataHandle.size)
    const rows = parseBlockEntries(dataBlock)

    for (const row of rows) {
      if (row.key.length < 8) continue
      const userKey = row.key.subarray(0, row.key.length - 8)
      const tag = row.key.readBigUInt64LE(row.key.length - 8)
      const type = Number(tag & BigInt(0xff))
      const seq = tag >> BigInt(8)
      results.push({
        userKey,
        seq,
        type,
        value: row.value,
      })
    }
  }

  return results
}

async function readWalEntries(filePath: string): Promise<LevelDbEntry[]> {
  const walBuf = await fs.readFile(filePath)
  const records = readLevelDbLogRecords(walBuf)
  const entries: LevelDbEntry[] = []

  for (const record of records) {
    if (record.length < 12) continue
    const baseSeq = record.readBigUInt64LE(0)
    const count = record.readUInt32LE(8)
    let pos = 12

    for (let i = 0; i < count && pos < record.length; i += 1) {
      const op = record[pos++]
      if (op === 1) {
        const keySlice = readLengthPrefixedSlice(record, pos)
        const valSlice = readLengthPrefixedSlice(record, keySlice.next)
        pos = valSlice.next
        entries.push({
          userKey: Buffer.from(keySlice.data),
          seq: baseSeq + BigInt(i),
          type: 1,
          value: Buffer.from(valSlice.data),
        })
      } else if (op === 0) {
        const keySlice = readLengthPrefixedSlice(record, pos)
        pos = keySlice.next
        entries.push({
          userKey: Buffer.from(keySlice.data),
          seq: baseSeq + BigInt(i),
          type: 0,
          value: Buffer.alloc(0),
        })
      } else {
        break
      }
    }
  }

  return entries
}

export async function readLevelDbKeyValues(
  dbDir: string,
): Promise<Map<string, { rawKey: Buffer; value: Buffer }>> {
  const dirEntries = await fs.readdir(dbDir, { withFileTypes: true })
  const manifest = await readManifestState(dbDir)

  const tableFiles: string[] = []
  const logFiles: string[] = []

  for (const entry of dirEntries) {
    if (!entry.isFile()) continue
    const match = /^(\d+)\.(ldb|sst|log)$/i.exec(entry.name)
    if (!match) continue
    const num = Number(match[1])
    const ext = match[2].toLowerCase()

    if (ext === 'ldb' || ext === 'sst') {
      if (!manifest.hasManifest || manifest.activeFiles.has(num)) {
        tableFiles.push(path.join(dbDir, entry.name))
      }
    } else if (ext === 'log') {
      if (!manifest.hasManifest || num >= manifest.logNumber) {
        logFiles.push(path.join(dbDir, entry.name))
      }
    }
  }

  const latest = new Map<string, LevelDbEntry>()
  const applyEntry = (entry: LevelDbEntry) => {
    const keyHex = entry.userKey.toString('hex')
    const prev = latest.get(keyHex)
    if (!prev || entry.seq >= prev.seq) {
      latest.set(keyHex, entry)
    }
  }

  for (const file of tableFiles) {
    const rows = await readSstableEntries(file)
    for (const row of rows) applyEntry(row)
  }

  for (const file of logFiles) {
    const rows = await readWalEntries(file)
    for (const row of rows) applyEntry(row)
  }

  const output = new Map<string, { rawKey: Buffer; value: Buffer }>()
  for (const [keyHex, entry] of latest.entries()) {
    if (entry.type === 1) {
      output.set(keyHex, {
        rawKey: entry.userKey,
        value: entry.value,
      })
    }
  }
  return output
}

type PouchRevNode = [string, { status?: string }?, PouchRevNode[]?]

type PouchMetadata = {
  id?: string
  winningRev?: string
  deleted?: boolean
  rev_tree?: Array<{ pos: number; ids: PouchRevNode }>
  rev_map?: Record<string, number>
}

function calculateWinningRevFromTree(metadata: PouchMetadata): {
  winningRev: string
  deleted: boolean
} {
  if (metadata.winningRev && typeof metadata.deleted === 'boolean') {
    return { winningRev: metadata.winningRev, deleted: metadata.deleted }
  }

  const leaves: Array<{ pos: number; rev: string; deleted: boolean }> = []

  const walk = (pos: number, node: PouchRevNode) => {
    const [hash, opts, children] = node
    const rev = `${pos}-${hash}`
    if (!Array.isArray(children) || children.length === 0) {
      leaves.push({
        pos,
        rev,
        deleted: opts?.status === 'deleted',
      })
      return
    }
    for (const child of children) {
      walk(pos + 1, child)
    }
  }

  for (const branch of metadata.rev_tree ?? []) {
    if (branch && Array.isArray(branch.ids)) {
      walk(branch.pos, branch.ids)
    }
  }

  if (leaves.length === 0) {
    return { winningRev: '', deleted: true }
  }

  const available = leaves.filter((leaf) => !leaf.deleted)
  const candidates = available.length > 0 ? available : leaves
  candidates.sort((a, b) => {
    if (a.pos !== b.pos) return b.pos - a.pos
    return b.rev.localeCompare(a.rev)
  })

  return {
    winningRev: candidates[0].rev,
    deleted: candidates[0].deleted,
  }
}

function splitSublevelKey(rawKey: Buffer): { sublevel: string; key: string } | null {
  const utf8 = rawKey.toString('utf8')
  if (utf8.startsWith('\u00ff')) {
    const second = utf8.indexOf('\u00ff', 1)
    if (second > 1) {
      return {
        sublevel: utf8.slice(1, second),
        key: utf8.slice(second + 1),
      }
    }
  }

  if (rawKey[0] === 0xff) {
    const second = rawKey.indexOf(0xff, 1)
    if (second > 1) {
      return {
        sublevel: rawKey.subarray(1, second).toString('utf8'),
        key: rawKey.subarray(second + 1).toString('utf8'),
      }
    }
  }

  return null
}

export type PouchDbReadResult = {
  docs: Array<Record<string, unknown>>
  getAttachmentBuffer: (doc: Record<string, unknown>, attachmentId: string) => Buffer | null
  warnings: string[]
}

export async function readPouchDbDirectory(dbDir: string): Promise<PouchDbReadResult> {
  const kv = await readLevelDbKeyValues(dbDir)
  const docMetaMap = new Map<string, PouchMetadata>()
  const bySeqMap = new Map<string, Record<string, unknown>>()
  const binaryStore = new Map<string, Buffer>()
  const warnings: string[] = []

  for (const { rawKey, value } of kv.values()) {
    const split = splitSublevelKey(rawKey)
    if (!split) continue

    if (split.sublevel === 'document-store') {
      try {
        docMetaMap.set(split.key, JSON.parse(value.toString('utf8')) as PouchMetadata)
      } catch (error) {
        warnings.push(`跳过损坏的 PouchDB 元数据 (${split.key}): ${(error as Error).message}`)
      }
    } else if (split.sublevel === 'by-sequence') {
      try {
        bySeqMap.set(split.key, JSON.parse(value.toString('utf8')) as Record<string, unknown>)
      } catch (error) {
        warnings.push(`跳过损坏的 PouchDB 序列文档 (${split.key}): ${(error as Error).message}`)
      }
    } else if (split.sublevel === 'attach-binary-store') {
      binaryStore.set(split.key, value)
    }
  }

  const docs: Array<Record<string, unknown>> = []
  for (const [docId, metadata] of docMetaMap.entries()) {
    if (docId.startsWith('_design/')) continue

    const { winningRev, deleted } = calculateWinningRevFromTree(metadata)
    if (deleted || !winningRev) continue

    const seq = metadata.rev_map?.[winningRev]
    if (seq === undefined || seq === null) continue

    const seqKey = String(seq).padStart(16, '0')
    const body = bySeqMap.get(seqKey)
    if (!body) continue

    docs.push({
      ...body,
      _id: metadata.id || body._id || docId,
      _rev: winningRev,
    })
  }

  const getAttachmentBuffer = (
    doc: Record<string, unknown>,
    attachmentId: string,
  ): Buffer | null => {
    const attachments = doc._attachments as
      | Record<string, { digest?: string } | undefined>
      | undefined
    const digest = attachments?.[attachmentId]?.digest
    if (!digest) return null
    return binaryStore.get(digest) ?? null
  }

  return {
    docs,
    getAttachmentBuffer,
    warnings,
  }
}
