export const LIBRARY_FOLDER_LOGO_DIRECTORY = 'library-folder-logos'
export const LIBRARY_FOLDER_LOGO_URL_PREFIX = `/assets/${LIBRARY_FOLDER_LOGO_DIRECTORY}/`

export function isLibraryFolderLogoFilename(name: string) {
  return /^[a-f0-9]{64}\.(png|jpg|webp|gif|avif)$/.test(name)
}

export function isLibraryFolderLogoFile(source?: string) {
  return source?.startsWith(LIBRARY_FOLDER_LOGO_URL_PREFIX) ?? false
}
