// ── 图片本地化 ─────────────────────────────────────────────

const IMAGE_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
}

const pickImageExt = (url: string, contentType: string | null) => {
  const contentKey = contentType?.split(';')[0].trim().toLowerCase() || ''
  if (contentKey && IMAGE_EXT_MAP[contentKey]) {
    return IMAGE_EXT_MAP[contentKey]
  }

  try {
    const parsed = new URL(url)
    const ext = parsed.pathname.split('.').pop()?.toLowerCase() || ''
    if (ext && /^[a-z0-9]+$/.test(ext)) {
      return ext
    }
  } catch {
    // ignore
  }

  return 'jpg'
}

const sanitizeFileNamePart = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

/** 将远程角色图片下载到本地 public 目录，返回本地路径（仅服务端可用） */
export const localizeCharacterImage = async (
  gameId: number,
  characterId: string,
  sourceUrl: string,
  headers?: Record<string, string>,
): Promise<string> => {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')

  const normalized = sourceUrl.trim()
  if (!normalized) {
    return ''
  }

  if (!/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  const response = await fetch(normalized, {
    headers: {
      ...headers,
    },
  })
  if (!response.ok) {
    throw new Error(`下载角色图片失败: ${response.status}`)
  }

  const ext = pickImageExt(normalized, response.headers.get('content-type'))
  const safeCharacterId = sanitizeFileNamePart(characterId) || 'character'

  const publicDir = path.join(process.cwd(), 'assets', 'characters', String(gameId))

  await fs.mkdir(publicDir, { recursive: true })

  // 保留扩展名以便 Web 服务器正确识别 MIME 类型
  const filePath = path.join(publicDir, `${safeCharacterId}.${ext}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  return `/assets/characters/${gameId}/${safeCharacterId}.${ext}`
}

// ── 通用工具 ──────────────────────────────────────────────

export const toNullableIntFromUnknown = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : null
  }
  if (typeof value === 'string') {
    const num = Number(value.trim())
    return Number.isFinite(num) ? Math.trunc(num) : null
  }
  return null
}
