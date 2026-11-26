export type ExternalSourceIdEntry = {
  provider: string
  externalId: string
}

const EXTERNAL_SOURCE_SEGMENT_SPLIT = /[;；,，、]+/
const EXTERNAL_SOURCE_KV_SPLIT = /[:：]/

export function parseExternalSourceIds(
  value: unknown,
  options?: { strict?: boolean },
): ExternalSourceIdEntry[] | null {
  const strict = options?.strict ?? false

  if (typeof value !== 'string') {
    return strict ? null : []
  }

  const raw = value.trim()
  if (!raw) {
    return []
  }

  const dedup = new Set<string>()
  const result: ExternalSourceIdEntry[] = []

  for (const rawSegment of raw.split(EXTERNAL_SOURCE_SEGMENT_SPLIT)) {
    const segment = rawSegment.trim()
    if (!segment) {
      continue
    }

    const divider = segment.search(EXTERNAL_SOURCE_KV_SPLIT)
    if (divider <= 0 || divider >= segment.length - 1) {
      if (strict) {
        return null
      }
      continue
    }

    const provider = segment.slice(0, divider).trim()
    const externalId = segment.slice(divider + 1).trim()
    if (!provider || !externalId) {
      if (strict) {
        return null
      }
      continue
    }

    const key = `${provider}:${externalId}`
    if (dedup.has(key)) {
      continue
    }

    dedup.add(key)
    result.push({ provider, externalId })
  }

  return result
}
