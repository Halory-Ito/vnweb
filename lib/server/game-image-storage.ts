import fs from 'node:fs/promises'
import path from 'node:path'

type ImageAssetType = 'cover' | 'bg' | 'icon' | 'logo'

type LocalizeGameImageInput = {
  gameName: string
  releaseDate?: string
  imageType: ImageAssetType
  sourceUrl: string
}

type ImageFileInfoInput = {
  gameName: string
  releaseDate?: string
  imageType: ImageAssetType
  sourceUrl: string
  contentType?: string | null
}

const CONTENT_TYPE_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/svg+xml': 'svg',
}

const sanitizeFileNamePart = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

const normalizeReleaseDate = (value: string | undefined) => {
  const raw = (value || '').trim()
  if (!raw) {
    return 'unknown-date'
  }

  const matched = raw.match(/\d{4}-\d{2}-\d{2}/)
  if (matched) {
    return matched[0]
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return sanitizeFileNamePart(raw) || 'unknown-date'
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const pickExtFromUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    const ext = path.extname(parsed.pathname).replace('.', '').toLowerCase()
    if (!ext) {
      return ''
    }

    if (!/^[a-z0-9]+$/.test(ext)) {
      return ''
    }

    return ext
  } catch {
    return ''
  }
}

const pickExtFromContentType = (contentType: string | null) => {
  if (!contentType) {
    return ''
  }

  const normalized = contentType.split(';')[0].trim().toLowerCase()
  return CONTENT_TYPE_EXT_MAP[normalized] || ''
}

const pickExtFromDataUrl = (value: string) => {
  const matched = value.match(/^data:([^;,]+)[;,]/i)
  if (!matched) {
    return ''
  }
  return pickExtFromContentType(matched[1] || '')
}

const isRemoteImageUrl = (value: string) => /^https?:\/\//i.test(value)

const isLocalAssetPath = (value: string) => value.startsWith('/assets/')

const isDataUrl = (value: string) => /^data:/i.test(value)

const toImageFileInfo = ({
  gameName,
  releaseDate,
  imageType,
  sourceUrl,
  contentType,
}: ImageFileInfoInput) => {
  const safeName = sanitizeFileNamePart(gameName) || 'game'
  const safeDate = normalizeReleaseDate(releaseDate)
  const extFromHeader = pickExtFromContentType(contentType || null)
  const extFromDataUrl = pickExtFromDataUrl(sourceUrl)
  const extFromUrl = pickExtFromUrl(sourceUrl)
  const fileExt = extFromHeader || extFromDataUrl || extFromUrl || 'jpg'
  const fileName = `${safeName}_${safeDate}_${imageType}.${fileExt}`

  const assetsDir = path.join(process.cwd(), 'assets', imageType)
  const publicDir = path.join(process.cwd(), 'assets', imageType)

  return {
    fileName,
    assetsDir,
    publicDir,
    assetPath: path.join(assetsDir, fileName),
    publicFilePath: path.join(publicDir, fileName),
    publicPath: `/assets/${imageType}/${fileName}`,
  }
}

const decodeDataUrl = (value: string) => {
  const matched = value.match(/^data:([^;,]+)?(;base64)?,(.*)$/i)
  if (!matched) {
    throw new Error('无效的 data url 图片')
  }

  const mime = matched[1] || ''
  const encoded = matched[3] || ''
  const isBase64 = Boolean(matched[2])
  const raw = isBase64
    ? Buffer.from(encoded, 'base64')
    : Buffer.from(decodeURIComponent(encoded), 'utf8')

  return {
    mime,
    buffer: raw,
  }
}

const writeBufferToTargets = async (
  buffer: Buffer,
  target: {
    assetsDir: string
    publicDir: string
    assetPath: string
    publicFilePath: string
  },
) => {
  await fs.mkdir(target.assetsDir, { recursive: true })
  await fs.mkdir(target.publicDir, { recursive: true })
  await fs.writeFile(target.assetPath, buffer)
  await fs.writeFile(target.publicFilePath, buffer)
}

const localizeGameImageInternal = async ({
  gameName,
  releaseDate,
  imageType,
  sourceUrl,
}: LocalizeGameImageInput): Promise<string> => {
  const normalizedUrl = sourceUrl.trim()
  if (!normalizedUrl) {
    return ''
  }

  if (isLocalAssetPath(normalizedUrl)) {
    return normalizedUrl
  }

  if (isDataUrl(normalizedUrl)) {
    const decoded = decodeDataUrl(normalizedUrl)
    const target = toImageFileInfo({
      gameName,
      releaseDate,
      imageType,
      sourceUrl: normalizedUrl,
      contentType: decoded.mime,
    })
    await writeBufferToTargets(decoded.buffer, target)
    return target.publicPath
  }

  if (!isRemoteImageUrl(normalizedUrl)) {
    return normalizedUrl
  }

  const response = await fetch(normalizedUrl)
  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const target = toImageFileInfo({
    gameName,
    releaseDate,
    imageType,
    sourceUrl: normalizedUrl,
    contentType: response.headers.get('content-type'),
  })
  await writeBufferToTargets(buffer, target)
  return target.publicPath
}

export const predictLocalGameImagePath = ({
  gameName,
  releaseDate,
  imageType,
  sourceUrl,
}: LocalizeGameImageInput): string => {
  const normalizedUrl = sourceUrl.trim()
  if (!normalizedUrl || isLocalAssetPath(normalizedUrl)) {
    return normalizedUrl
  }

  if (!isRemoteImageUrl(normalizedUrl) && !isDataUrl(normalizedUrl)) {
    return normalizedUrl
  }

  return toImageFileInfo({
    gameName,
    releaseDate,
    imageType,
    sourceUrl: normalizedUrl,
  }).publicPath
}

export const localizeGameImage = async ({
  gameName,
  releaseDate,
  imageType,
  sourceUrl,
}: LocalizeGameImageInput): Promise<string> => {
  return localizeGameImageInternal({
    gameName,
    releaseDate,
    imageType,
    sourceUrl,
  })
}

export const localizeGameImageInBackground = ({
  gameName,
  releaseDate,
  imageType,
  sourceUrl,
}: LocalizeGameImageInput): string => {
  const targetPath = predictLocalGameImagePath({
    gameName,
    releaseDate,
    imageType,
    sourceUrl,
  })

  void localizeGameImageInternal({
    gameName,
    releaseDate,
    imageType,
    sourceUrl,
  }).catch((error) => {
    console.error('Background image localization failed:', error)
  })

  return targetPath
}

export const localizeGameImageFields = async (params: {
  gameName: string
  releaseDate?: string
  cover?: string
  bg?: string
  icon?: string
  logo?: string
}) => {
  const { gameName, releaseDate } = params

  const [cover, bg, icon, logo] = await Promise.all([
    params.cover
      ? localizeGameImage({
          gameName,
          releaseDate,
          imageType: 'cover',
          sourceUrl: params.cover,
        })
      : Promise.resolve(''),
    params.bg
      ? localizeGameImage({
          gameName,
          releaseDate,
          imageType: 'bg',
          sourceUrl: params.bg,
        })
      : Promise.resolve(''),
    params.icon
      ? localizeGameImage({
          gameName,
          releaseDate,
          imageType: 'icon',
          sourceUrl: params.icon,
        })
      : Promise.resolve(''),
    params.logo
      ? localizeGameImage({
          gameName,
          releaseDate,
          imageType: 'logo',
          sourceUrl: params.logo,
        })
      : Promise.resolve(''),
  ])

  return {
    cover,
    bg,
    icon,
    logo,
  }
}

export const localizeGameImageFieldsInBackground = (params: {
  gameName: string
  releaseDate?: string
  cover?: string
  bg?: string
  icon?: string
  logo?: string
}) => {
  const { gameName, releaseDate } = params

  const cover = params.cover
    ? localizeGameImageInBackground({
        gameName,
        releaseDate,
        imageType: 'cover',
        sourceUrl: params.cover,
      })
    : ''
  const bg = params.bg
    ? localizeGameImageInBackground({
        gameName,
        releaseDate,
        imageType: 'bg',
        sourceUrl: params.bg,
      })
    : ''
  const icon = params.icon
    ? localizeGameImageInBackground({
        gameName,
        releaseDate,
        imageType: 'icon',
        sourceUrl: params.icon,
      })
    : ''
  const logo = params.logo
    ? localizeGameImageInBackground({
        gameName,
        releaseDate,
        imageType: 'logo',
        sourceUrl: params.logo,
      })
    : ''

  return {
    cover,
    bg,
    icon,
    logo,
  }
}
