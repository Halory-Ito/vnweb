import { inflateSync } from 'node:zlib'

const NAME_TABLE_MAX_BYTES = 1024 * 1024

function readNameTable(font: Buffer) {
  const format = font.toString('latin1', 0, 4)
  if (format === 'wOF2') return

  const isWoff = format === 'wOFF'
  const faceOffset = format === 'ttcf' ? font.readUInt32BE(12) : 0
  const tableCount = font.readUInt16BE(faceOffset + (isWoff ? 12 : 4))
  const entrySize = isWoff ? 20 : 16
  const directory = faceOffset + (isWoff ? 44 : 12)
  for (let index = 0; index < tableCount; index++) {
    const entry = directory + index * entrySize
    if (font.toString('latin1', entry, entry + 4) !== 'name') continue
    const offset = font.readUInt32BE(entry + (isWoff ? 4 : 8))
    const length = font.readUInt32BE(entry + (isWoff ? 8 : 12))
    const originalLength = isWoff ? font.readUInt32BE(entry + 12) : length
    if (offset + length > font.length || originalLength > NAME_TABLE_MAX_BYTES) return

    const data = font.subarray(offset, offset + length)
    return length === originalLength ? data : inflateSync(data, { maxOutputLength: originalLength })
  }
}

const utf16 = new TextDecoder('utf-16be')

export function getChineseFontDisplayName(font: Buffer): string | undefined {
  try {
    const table = readNameTable(font)
    if (!table || table.length < 6) return

    const count = table.readUInt16BE(2)
    const storageOffset = table.readUInt16BE(4)
    if (6 + count * 12 > storageOffset || storageOffset > table.length) return

    let bestName: string | undefined
    let bestScore = 0
    for (let index = 0; index < count; index++) {
      const record = 6 + index * 12
      const platform = table.readUInt16BE(record)
      const encoding = table.readUInt16BE(record + 2)
      const language = table.readUInt16BE(record + 4)
      const nameId = table.readUInt16BE(record + 6)
      const rank = [4, 1, 16].indexOf(nameId) + 1
      if (!rank || (platform !== 0 && platform !== 3)) continue
      if (platform === 3 && ![0, 1, 3, 4, 10].includes(encoding)) continue
      if (platform === 3 && language > 0 && language < 0x8000 && (language & 0x3ff) !== 4) continue

      const length = table.readUInt16BE(record + 8)
      const offset = storageOffset + table.readUInt16BE(record + 10)
      if (offset + length > table.length) continue

      const decoder =
        platform === 3 && encoding === 3
          ? new TextDecoder('gbk')
          : platform === 3 && encoding === 4
            ? new TextDecoder('big5')
            : utf16
      const name = decoder.decode(table.subarray(offset, offset + length)).trim()
      if (!/\p{Script=Han}/u.test(name) || /[\p{Cc}\uFFFD]/u.test(name)) continue

      const localeScore =
        platform === 3 && language === 0x0804
          ? 8
          : platform === 3 && (language & 0x3ff) === 4
            ? 4
            : 0
      const score = localeScore + rank
      if (score > bestScore) {
        bestName = name
        bestScore = score
      }
    }
    return bestName
  } catch {
    return undefined
  }
}
