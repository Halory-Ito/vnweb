export const STARTUP_MEDIA_NAME_MAX_LENGTH = 60

export const STARTUP_IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
}

export const STARTUP_VIDEO_MIME_EXTENSIONS: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogg',
  'video/quicktime': '.mov',
  'video/x-m4v': '.m4v',
}

export const ALLOWED_STARTUP_IMAGE_EXT_SET = new Set(Object.values(STARTUP_IMAGE_MIME_EXTENSIONS))
export const ALLOWED_STARTUP_VIDEO_EXT_SET = new Set(Object.values(STARTUP_VIDEO_MIME_EXTENSIONS))

const WINDOWS_RESERVED_NAME_PATTERN = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i
const STARTUP_NAME_PATTERN = /^[\p{L}\p{N}\p{M} _-]*$/u
const MEDIA_PROBE_TIMEOUT_MS = 5000

export function isValidStartupMediaName(name: string): boolean {
  if (name.length > STARTUP_MEDIA_NAME_MAX_LENGTH || !STARTUP_NAME_PATTERN.test(name)) {
    return false
  }
  const trimmed = name.trim()
  if (!trimmed) {
    return true
  }
  return !WINDOWS_RESERVED_NAME_PATTERN.test(trimmed)
}

export function resolveStartupMediaMeta(
  fileName: string,
  mimeType: string,
): { mediaType: 'image' | 'video'; ext: string } | null {
  const rawExt = fileName.match(/\.[a-z0-9]{1,10}$/i)?.[0].toLowerCase() ?? ''
  const mime = mimeType.toLowerCase()

  if (mime.startsWith('image/') || ALLOWED_STARTUP_IMAGE_EXT_SET.has(rawExt)) {
    const ext = ALLOWED_STARTUP_IMAGE_EXT_SET.has(rawExt)
      ? rawExt
      : (STARTUP_IMAGE_MIME_EXTENSIONS[mime] ?? '.png')
    return { mediaType: 'image', ext }
  }

  if (mime.startsWith('video/') || ALLOWED_STARTUP_VIDEO_EXT_SET.has(rawExt)) {
    const ext = ALLOWED_STARTUP_VIDEO_EXT_SET.has(rawExt)
      ? rawExt
      : (STARTUP_VIDEO_MIME_EXTENSIONS[mime] ?? '.mp4')
    return { mediaType: 'video', ext }
  }

  return null
}

export function extractStartupFileName(mediaPath: string): string {
  const cleanPath = mediaPath.split(/[?#]/)[0]?.trim() ?? ''
  const rawName = cleanPath.split('/').pop() ?? ''
  if (!rawName) return ''
  try {
    return decodeURIComponent(rawName)
  } catch {
    return rawName
  }
}

export function splitFileNameParts(fileName: string): { baseName: string; extension: string } {
  const match = fileName.match(/^(.*?)(\.[^.]+)$/)
  if (!match) {
    return { baseName: fileName, extension: '' }
  }
  return { baseName: match[1] ?? '', extension: match[2] ?? '' }
}

export async function probeStartupMediaDimensionsFromUrl(
  url: string,
  mediaType: 'image' | 'video',
): Promise<{ width: number; height: number } | null> {
  if (typeof window === 'undefined' || !url) {
    return null
  }

  return await new Promise((resolve) => {
    let settled = false
    let cleanup = () => {}

    const finish = (result: { width: number; height: number } | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      cleanup()
      resolve(result)
    }

    const timer = window.setTimeout(() => finish(null), MEDIA_PROBE_TIMEOUT_MS)

    if (mediaType === 'image') {
      const img = new Image()
      cleanup = () => {
        img.onload = null
        img.onerror = null
      }
      img.onload = () => {
        const width = Math.round(img.naturalWidth)
        const height = Math.round(img.naturalHeight)
        finish(width > 0 && height > 0 ? { width, height } : null)
      }
      img.onerror = () => finish(null)
      img.src = url
      return
    }

    const video = document.createElement('video')
    cleanup = () => {
      video.onloadedmetadata = null
      video.onerror = null
      video.removeAttribute('src')
      video.load()
    }
    video.preload = 'metadata'
    video.muted = true
    video.onloadedmetadata = () => {
      const width = Math.round(video.videoWidth)
      const height = Math.round(video.videoHeight)
      finish(width > 0 && height > 0 ? { width, height } : null)
    }
    video.onerror = () => finish(null)
    video.src = url
  })
}

export async function probeStartupMediaDimensionsFromFile(
  file: File,
  mediaType: 'image' | 'video',
): Promise<{ width: number; height: number } | null> {
  if (typeof window === 'undefined') {
    return null
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    return await probeStartupMediaDimensionsFromUrl(objectUrl, mediaType)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
