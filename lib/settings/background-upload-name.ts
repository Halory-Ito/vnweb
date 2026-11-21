export const BACKGROUND_NAME_MAX_LENGTH = 60

export function isValidBackgroundName(name: string) {
  return name.length <= BACKGROUND_NAME_MAX_LENGTH && /^[\p{L}\p{N}\p{M} _-]*$/u.test(name)
}

export function getBackgroundImageExtension(filename: string, mime: string) {
  const extension = filename.match(/\.[a-z0-9]{1,10}$/i)?.[0].toLowerCase()
  if (extension) return extension

  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/svg+xml': '.svg',
  }
  return extensions[mime] ?? '.png'
}
