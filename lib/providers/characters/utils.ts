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

  // 使用 Node.js 原生 http/https 模块下载
  const https = await import('node:https')
  const http = await import('node:http')

  const downloadImage = (url: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https')
      const client = isHttps ? https : http

      const options = new URL(url)
      const reqOptions = {
        hostname: options.hostname,
        port: options.port,
        path: options.pathname + options.search,
        method: 'GET',
        headers: {
          ...headers,
          'User-Agent': 'Mozilla/5.0',
        },
      }

      const req = client.request(reqOptions, (res) => {
        // 处理重定向
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          downloadImage(res.headers.location).then(resolve).catch(reject)
          return
        }

        if (res.statusCode !== 200) {
          reject(new Error(`下载角色图片失败: ${res.statusCode}`))
          return
        }

        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      })

      req.on('error', reject)
      req.end()
    })
  }

  const buffer = await downloadImage(normalized)

  const ext = pickImageExt(normalized, null)
  const safeCharacterId = sanitizeFileNamePart(characterId) || 'character'

  const publicDir = path.join(
    process.cwd(),
    'assets',
    'characters',
    String(gameId),
  )

  await fs.mkdir(publicDir, { recursive: true })

  // 保留扩展名以便 Web 服务器正确识别 MIME 类型
  const filePath = path.join(publicDir, `${safeCharacterId}.${ext}`)
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
