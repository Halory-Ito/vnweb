import { imageSize } from 'image-size'
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY,
  LIBRARY_FOLDER_LOGO_DIRECTORY,
  LIBRARY_FOLDER_LOGO_URL_PREFIX,
} from '@/lib/library-folder-logo-path'
import { APPEARANCE_MAX_IMAGE_BYTES } from '@/lib/settings/appearance-image'

const imageExtensions = new Map([
  ['png', 'png'],
  ['jpg', 'jpg'],
  ['jpeg', 'jpg'],
  ['webp', 'webp'],
  ['gif', 'gif'],
  ['avif', 'avif'],
])

export function getLibraryFolderLogoDirectory() {
  return path.join(process.cwd(), 'assets', LIBRARY_FOLDER_LOGO_DIRECTORY)
}

export function getLegacyLibraryFolderLogoDirectory() {
  return path.join(process.cwd(), 'assets', LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY)
}

export async function migrateLegacyLibraryLogoDirectory(): Promise<void> {
  const legacyDir = getLegacyLibraryFolderLogoDirectory()
  let entries
  try {
    entries = await fs.readdir(legacyDir, { withFileTypes: true })
  } catch {
    return
  }

  const targetDir = getLibraryFolderLogoDirectory()
  await fs.mkdir(targetDir, { recursive: true })

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const from = path.join(legacyDir, entry.name)
    const to = path.join(targetDir, entry.name)
    try {
      await fs.access(to)
      await fs.rm(from, { force: true })
    } catch {
      try {
        await fs.rename(from, to)
      } catch {
        await fs.copyFile(from, to)
        await fs.unlink(from)
      }
    }
  }

  try {
    await fs.rmdir(legacyDir)
  } catch {
    // Ignore if directory still has remaining entries
  }
}

export function decodeLibraryLogo(source: string) {
  return Buffer.from(source.slice(source.indexOf(',') + 1), 'base64')
}

export function getLibraryLogoExtension(image: Buffer) {
  if (!image.length || image.length > APPEARANCE_MAX_IMAGE_BYTES) {
    throw new Error('图片不能为空或超过 256 KB。')
  }

  let extension: string | undefined
  try {
    extension = imageExtensions.get(imageSize(image).type ?? '')
  } catch {
    throw new Error('无法读取图片。')
  }
  if (!extension) throw new Error('图片格式不受支持。')
  return extension
}

async function writeLogoFile(image: Buffer, extension: string) {
  const directory = getLibraryFolderLogoDirectory()
  const filename = `${createHash('sha256').update(image).digest('hex')}.${extension}`
  const destination = path.join(directory, filename)
  const temporary = path.join(directory, `.${randomUUID()}.tmp`)

  await fs.mkdir(directory, { recursive: true })
  try {
    await fs.writeFile(temporary, image, { flag: 'wx' })
    await fs.rename(temporary, destination)
  } finally {
    await fs.rm(temporary, { force: true })
  }

  return `${LIBRARY_FOLDER_LOGO_URL_PREFIX}${filename}`
}

export function writeLibraryLogoImage(image: Buffer) {
  return writeLogoFile(image, getLibraryLogoExtension(image))
}

export function migrateLibraryLogoSource(source: string) {
  if (!/^data:/i.test(source)) return source

  // Older uploads were validated by their declared image type.
  const type = /^data:image\/([^;]+);base64,/i.exec(source)?.[1]?.toLowerCase()
  const extension = imageExtensions.get(type ?? '')
  if (!extension) throw new Error('无法迁移旧版 LOGO：图片格式无效。')
  return writeLogoFile(decodeLibraryLogo(source), extension)
}
