export const CCTV_M3U8_STORAGE_KEY = 'vnweb:addon:cctv-4k:m3u8-url'

export type LiveChannel = {
  id: string
  name: string
  url: string
}

export type LiveSource = {
  id: string
  name: string
  url: string
  priority: number
  icon: string
  valid: boolean
  needProxy: boolean
}

function normalizeName(input: string) {
  return input.replace(/\s+/g, ' ').trim()
}

function normalizeUrl(input: string) {
  return input.trim()
}

export function isPlayableLiveUrl(url: string) {
  const normalized = normalizeUrl(url)

  if (!/^https?:\/\//i.test(normalized)) {
    return false
  }

  // Prioritize HLS-style links for browser playback stability.
  if (/\.m3u8($|[?#])/i.test(normalized)) {
    return true
  }

  return false
}

function resolveChannelUrl(rawUrl: string, playlistUrl: string) {
  try {
    return new URL(rawUrl, playlistUrl).toString()
  } catch {
    return rawUrl
  }
}

function getNameFromStreamInf(line: string) {
  const nameMatch = line.match(/NAME="([^"]+)"/i)
  if (nameMatch?.[1]) {
    return nameMatch[1]
  }

  return ''
}

export function parseM3U8Channels(content: string, playlistUrl: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const channels: LiveChannel[] = []
  const dedup = new Set<string>()
  let pendingName = ''
  let sequence = 1

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const namePart = line.split(',').slice(1).join(',').trim()
      pendingName = namePart || `频道 ${sequence}`
      continue
    }

    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const nameFromTag = getNameFromStreamInf(line)
      pendingName = nameFromTag || `频道 ${sequence}`
      continue
    }

    if (line.startsWith('#')) {
      continue
    }

    const name = normalizeName(pendingName || `频道 ${sequence}`)
    const resolvedUrl = normalizeUrl(resolveChannelUrl(line, playlistUrl))
    const key = `${name}\u0000${resolvedUrl}`

    if (dedup.has(key)) {
      pendingName = ''
      sequence += 1
      continue
    }

    dedup.add(key)
    channels.push({
      id: `${sequence}-${name}-${resolvedUrl}`,
      name,
      url: resolvedUrl,
    })

    pendingName = ''
    sequence += 1
  }

  return channels
}
