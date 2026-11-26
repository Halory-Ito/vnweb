export type ImageField = 'cover' | 'bg' | 'icon' | 'logo'

export const imageFieldLabelMap: Record<ImageField, string> = {
  cover: '封面',
  bg: '背景',
  icon: '图标',
  logo: '徽标',
}

export const imageFieldAspectMap: Record<ImageField, number> = {
  cover: 2 / 3,
  bg: 16 / 9,
  icon: 1,
  logo: 3,
}

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })

export const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(new Error('图片加载失败，可能不支持跨域裁剪，建议先保存图片再裁剪'))
    image.src = src
  })

export const imageFieldList: ImageField[] = ['cover', 'bg', 'logo', 'icon']

export const isRemoteOrDataImage = (value: string) => /^https?:\/\/|^data:/i.test(value.trim())
