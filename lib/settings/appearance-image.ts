export const APPEARANCE_MAX_IMAGE_BYTES = 256 * 1024
export const APPEARANCE_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
]

export function isAppearanceImageUrl(value: string) {
  if (value.length > 2048 || value.includes('\\') || /[\r\n\t]/.test(value)) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
  } catch {
    return false
  }
}

export function isAppearanceImageSource(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (isAppearanceImageUrl(value) ||
      (value.length <= Math.ceil(APPEARANCE_MAX_IMAGE_BYTES / 3) * 4 + 32 &&
        /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[a-z\d+/]+={0,2}$/i.test(value)))
  )
}

export function readLocalAppearanceImage(file: File) {
  if (!APPEARANCE_IMAGE_TYPES.includes(file.type))
    throw new Error('请选择 PNG、JPEG、WebP、GIF 或 AVIF 图片。')
  if (file.size === 0 || file.size > APPEARANCE_MAX_IMAGE_BYTES)
    throw new Error('每张本地图片须小于或等于 256 KB。')
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('无法读取图片。'))
    reader.onabort = () => reject(new Error('图片读取已取消。'))
    reader.readAsDataURL(file)
  })
}
