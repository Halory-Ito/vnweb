// 图片附件的读取与压缩（仅客户端使用）

/** 图片保留的最长边，超出时按比例压缩 */
const MAX_IMAGE_DIMENSION = 1600

const DOWNSCALABLE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/avif',
])

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })

/** 超过最长边时按比例压缩为 JPEG，避免请求体过大 */
const downscaleImage = (dataUrl: string) =>
  new Promise<string>((resolve) => {
    const image = new window.Image()

    image.onload = () => {
      const longestSide = Math.max(image.width, image.height)
      const scale = longestSide > 0 ? Math.min(1, MAX_IMAGE_DIMENSION / longestSide) : 1

      if (scale >= 1) {
        resolve(dataUrl)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)

      const context = canvas.getContext('2d')
      if (!context) {
        resolve(dataUrl)
        return
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }

    image.onerror = () => resolve(dataUrl)
    image.src = dataUrl
  })

/** 读取图片为 data URL；位图过大时压缩（SVG / GIF 保持原样） */
export const readImageDataUrl = async (file: File) => {
  const raw = await readAsDataUrl(file)
  return DOWNSCALABLE_TYPES.has(file.type) ? downscaleImage(raw) : raw
}
