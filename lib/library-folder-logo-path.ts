export const LIBRARY_FOLDER_LOGO_DIRECTORY = 'brands'
export const LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY = 'library-folder-logos'
export const LIBRARY_FOLDER_LOGO_URL_PREFIX = `/assets/${LIBRARY_FOLDER_LOGO_DIRECTORY}/`
export const LEGACY_LIBRARY_FOLDER_LOGO_URL_PREFIX = `/assets/${LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY}/`

export function isLibraryFolderLogoFilename(name: string) {
  return /^[a-f0-9]{64}\.(png|jpg|webp|gif|avif)$/.test(name)
}

export function isLibraryFolderLogoFile(source?: string) {
  if (!source) return false
  return (
    source.startsWith(LIBRARY_FOLDER_LOGO_URL_PREFIX) ||
    source.startsWith(LEGACY_LIBRARY_FOLDER_LOGO_URL_PREFIX)
  )
}

export function toBrandLogoUrl(source: string) {
  if (source.startsWith(LEGACY_LIBRARY_FOLDER_LOGO_URL_PREFIX)) {
    return `${LIBRARY_FOLDER_LOGO_URL_PREFIX}${source.slice(LEGACY_LIBRARY_FOLDER_LOGO_URL_PREFIX.length)}`
  }
  return source
}
