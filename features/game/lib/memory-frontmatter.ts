import {
  RESERVED_MEMORY_METADATA_KEYS,
  sanitizeMemoryMetadataKey,
} from '@/lib/settings/memory-metadata-settings'

export type MemoryFrontmatterEntry = {
  key: string
  value: string
}

export type MemoryFrontmatter = {
  hasFrontmatter: boolean
  body: string
  title: string
  summary: string
  tags: string[]
  date: string
  ostSongIds: number[]
  extraEntries: MemoryFrontmatterEntry[]
}

const FRONTMATTER_REGEX = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/

const TITLE_KEYS = new Set(['title', '标题'])
const SUMMARY_KEYS = new Set([
  'summary',
  'description',
  'excerpt',
  'desc',
  'subtitle',
  '简介',
  '摘要',
  '描述',
])
const TAG_KEYS = new Set(['tags', 'tag', '标签'])
const DATE_KEYS = new Set(['date', 'updatedat', 'createdat', '日期'])

function unquote(value: string) {
  const trimmed = value.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed === 'string') {
        return parsed.trim()
      }
    } catch {
      // Fallback to raw slice when string is not strict JSON
    }
    return trimmed.slice(1, -1).trim()
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function parseInlineArray(value: string) {
  const inner = value.slice(1, -1).trim()
  if (!inner) {
    return []
  }
  return inner
    .split(',')
    .map((item) => unquote(item))
    .filter(Boolean)
}

function parseTagsValue(value: string | string[]) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean)
  }
  return value
    .split(/[,，]/)
    .map((item) => unquote(item))
    .filter(Boolean)
}

function parseOstSongIdsValue(value: string | string[]): number[] {
  const parts = Array.isArray(value) ? value : value.split(/[,，]/)
  const seen = new Set<number>()
  const ids: number[] = []
  for (const part of parts) {
    const parsed = Number(unquote(part))
    if (Number.isInteger(parsed) && parsed > 0 && !seen.has(parsed)) {
      seen.add(parsed)
      ids.push(parsed)
    }
  }
  return ids
}

function toDisplayString(value: string | string[]) {
  if (Array.isArray(value)) {
    return value
      .map((item) => item.trim())
      .filter(Boolean)
      .join('、')
  }
  return value.trim()
}

function parseYamlEntries(rawYaml: string) {
  const lines = rawYaml.split(/\r?\n/)
  const entries: Array<{ key: string; normalizedKey: string; value: string | string[] }> = []

  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      index += 1
      continue
    }

    const match = line.match(/^([^\s:#][^:]*?)\s*:\s*(.*)$/)
    if (!match) {
      index += 1
      continue
    }

    const key = match[1].trim()
    const normalizedKey = key.toLowerCase()
    const rest = match[2].trim()

    if (rest === '|' || rest === '|-' || rest === '>' || rest === '>-') {
      const folded = rest.startsWith('>')
      const blockLines: string[] = []
      index += 1

      while (index < lines.length) {
        const nextLine = lines[index]
        if (!nextLine.trim()) {
          blockLines.push('')
          index += 1
          continue
        }
        if (/^[ \t]+/.test(nextLine)) {
          blockLines.push(nextLine.trim())
          index += 1
          continue
        }
        break
      }

      const text = (folded ? blockLines.join(' ') : blockLines.join('\n')).trim()
      entries.push({ key, normalizedKey, value: text })
      continue
    }

    if (!rest) {
      const listItems: string[] = []
      let lookahead = index + 1

      while (lookahead < lines.length) {
        const nextLine = lines[lookahead]
        const nextTrimmed = nextLine.trim()
        if (!nextTrimmed || nextTrimmed.startsWith('#')) {
          lookahead += 1
          continue
        }
        const itemMatch = nextLine.match(/^[ \t]+-\s*(.*)$/) || nextLine.match(/^-\s+(.*)$/)
        if (!itemMatch) {
          break
        }
        const itemValue = unquote(itemMatch[1])
        if (itemValue) {
          listItems.push(itemValue)
        }
        lookahead += 1
      }

      index = listItems.length > 0 ? lookahead : index + 1
      entries.push({ key, normalizedKey, value: listItems })
      continue
    }

    if (rest.startsWith('[') && rest.endsWith(']')) {
      entries.push({ key, normalizedKey, value: parseInlineArray(rest) })
      index += 1
      continue
    }

    entries.push({ key, normalizedKey, value: unquote(rest) })
    index += 1
  }

  return entries
}

export function parseTagsInput(raw: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const part of raw.split(/[,，]/)) {
    const tag = part.trim()
    if (tag && !seen.has(tag)) {
      seen.add(tag)
      result.push(tag)
    }
  }
  return result
}

function formatYamlScalar(value: string) {
  const needsQuotes = /^[-?:,[\]{}#&*!|>'"%@`]|:\s|\s#|\s$|^true$|^false$|^null$|^~$/i.test(value)
  return needsQuotes ? JSON.stringify(value) : value
}

function serializeYamlField(key: string, value: string): string[] {
  if (value.includes('\n')) {
    return [`${key}: |`, ...value.split(/\r?\n/).map((line) => `  ${line}`)]
  }
  return [`${key}: ${formatYamlScalar(value)}`]
}

export function serializeMemoryMarkdown(input: {
  summary: string
  tags: string[]
  ostSongIds?: number[]
  extraEntries: MemoryFrontmatterEntry[]
  body: string
}): string {
  const summary = input.summary.trim()
  const tags = input.tags.map((item) => item.trim()).filter(Boolean)
  const ostSongIds = [
    ...new Set((input.ostSongIds ?? []).filter((id) => Number.isInteger(id) && id > 0)),
  ]
  const extraEntries = input.extraEntries
    .map((entry) => ({
      key: sanitizeMemoryMetadataKey(entry.key),
      value: entry.value.trim(),
    }))
    .filter(
      (entry) =>
        entry.key && entry.value && !RESERVED_MEMORY_METADATA_KEYS.has(entry.key.toLowerCase()),
    )

  if (!summary && tags.length === 0 && ostSongIds.length === 0 && extraEntries.length === 0) {
    return input.body.trim()
  }

  const cleanBody = parseMemoryFrontmatter(input.body)
    .body.replace(/^(?:\r?\n)+/, '')
    .trimEnd()
  const yamlLines: string[] = ['---']

  if (summary) {
    yamlLines.push(...serializeYamlField('summary', summary))
  }
  if (tags.length > 0) {
    yamlLines.push('tags:')
    for (const tag of tags) {
      yamlLines.push(`  - ${formatYamlScalar(tag)}`)
    }
  }
  if (ostSongIds.length > 0) {
    yamlLines.push('ostSongs:')
    for (const songId of ostSongIds) {
      yamlLines.push(`  - ${songId}`)
    }
  }
  for (const entry of extraEntries) {
    yamlLines.push(...serializeYamlField(entry.key, entry.value))
  }

  yamlLines.push('---')
  return cleanBody ? `${yamlLines.join('\n')}\n\n${cleanBody}` : yamlLines.join('\n')
}

export function parseMemoryFrontmatter(markdown: string): MemoryFrontmatter {
  const source = markdown || ''
  const matched = source.match(FRONTMATTER_REGEX)

  if (!matched) {
    return {
      hasFrontmatter: false,
      body: source,
      title: '',
      summary: '',
      tags: [],
      date: '',
      ostSongIds: [],
      extraEntries: [],
    }
  }

  const rawYaml = matched[1] ?? ''
  const body = source.slice(matched[0].length)
  const parsedEntries = parseYamlEntries(rawYaml)

  const pickFirstString = (keys: Set<string>) => {
    for (const entry of parsedEntries) {
      if (keys.has(entry.normalizedKey)) {
        const text = toDisplayString(entry.value)
        if (text) return text
      }
    }
    return ''
  }

  const pickTags = () => {
    for (const entry of parsedEntries) {
      if (TAG_KEYS.has(entry.normalizedKey)) {
        const tags = parseTagsValue(entry.value)
        if (tags.length > 0) return tags
      }
    }
    return []
  }

  const pickOstSongIds = () => {
    for (const entry of parsedEntries) {
      if (entry.normalizedKey === 'ostsongs') {
        const ids = parseOstSongIdsValue(entry.value)
        if (ids.length > 0) return ids
      }
    }
    return []
  }

  const extraEntries: MemoryFrontmatterEntry[] = []
  for (const entry of parsedEntries) {
    if (RESERVED_MEMORY_METADATA_KEYS.has(entry.normalizedKey)) {
      continue
    }
    const text = toDisplayString(entry.value)
    if (text) {
      extraEntries.push({ key: entry.key, value: text })
    }
  }

  return {
    hasFrontmatter: true,
    body,
    title: pickFirstString(TITLE_KEYS),
    summary: pickFirstString(SUMMARY_KEYS),
    tags: pickTags(),
    date: pickFirstString(DATE_KEYS),
    ostSongIds: pickOstSongIds(),
    extraEntries,
  }
}
