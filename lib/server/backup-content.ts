import fs from 'node:fs'
import path from 'node:path'

import { BACKUP_IMAGE_KEYS, BACKUP_IMAGE_LABELS } from '@/lib/backup-content'
import {
  LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY,
  LIBRARY_FOLDER_LOGO_DIRECTORY,
} from '@/lib/library-folder-logo-path'
import { EXTENSION_CATEGORY_MAP } from '@/lib/server/local-resources'
import {
  getAssetsDir,
  getCustomCssPath,
  getDataSettingsDir,
  getLegacyPublicAssetsDir,
} from '@/lib/server/runtime-paths.mjs'

import type { BackupContentOptions, BackupImageCategoryKey } from '@/types'

export type BackupAssetFile = {
  localPath: string
  archivePath: string
  size: number
  categoryLabel: string
}

export type BackupAssetBucket = {
  files: BackupAssetFile[]
  size: number
}

export type ScannedBackupAssets = {
  images: Record<BackupImageCategoryKey, BackupAssetBucket>
  video: BackupAssetBucket
  audio: BackupAssetBucket
  font: BackupAssetBucket
}

export type ClassifiedAssetCategory =
  | { type: 'image'; imageKey: BackupImageCategoryKey; label: string }
  | { type: 'video' | 'audio' | 'font'; label: string }

const IMAGE_FOLDER_CATEGORY_MAP: Record<string, BackupImageCategoryKey> = {
  cover: 'cover',
  ost: 'ostCover',
  bg: 'background',
  characters: 'character',
  cg: 'cg',
  icon: 'icon',
  logo: 'logo',
  [LIBRARY_FOLDER_LOGO_DIRECTORY]: 'brand',
  [LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY]: 'brand',
  memory: 'memory',
}

type AssetScanRoot = {
  dir: string
  archivePrefix: string
}

function getAssetScanRoots(): AssetScanRoot[] {
  return [
    { dir: getAssetsDir(), archivePrefix: 'assets' },
    { dir: getLegacyPublicAssetsDir(), archivePrefix: 'public-assets' },
  ]
}

function createEmptyScannedAssets(): ScannedBackupAssets {
  const images = {} as Record<BackupImageCategoryKey, BackupAssetBucket>
  for (const key of BACKUP_IMAGE_KEYS) {
    images[key] = { files: [], size: 0 }
  }
  return {
    images,
    video: { files: [], size: 0 },
    audio: { files: [], size: 0 },
    font: { files: [], size: 0 },
  }
}

export function classifyAssetSubPath(
  subRelative: string,
  ext: string,
): ClassifiedAssetCategory | null {
  const segments = subRelative.split('/').filter(Boolean)
  const firstSegment = segments.length > 1 ? (segments[0] ?? '') : ''
  const secondSegment = segments.length > 2 ? (segments[1] ?? '') : ''

  if (firstSegment === 'pv' && ext === '.ogg') {
    return { type: 'video', label: '视频' }
  }
  if (firstSegment === 'ost' && ext === '.lrc') {
    return { type: 'audio', label: '音频' }
  }

  const category = EXTENSION_CATEGORY_MAP[ext]
  if (!category) return null
  if (category === 'video') return { type: 'video', label: '视频' }
  if (category === 'audio') return { type: 'audio', label: '音频' }
  if (category === 'font') return { type: 'font', label: '字体' }

  const imageKey =
    firstSegment === 'bg' && secondSegment === 'custom'
      ? 'customBackground'
      : (IMAGE_FOLDER_CATEGORY_MAP[firstSegment] ?? 'other')

  return {
    type: 'image',
    imageKey,
    label: `图片 · ${BACKUP_IMAGE_LABELS[imageKey]}`,
  }
}

async function scanRootDirectory(
  currentDir: string,
  root: AssetScanRoot,
  scanned: ScannedBackupAssets,
): Promise<void> {
  let entries
  try {
    entries = await fs.promises.readdir(currentDir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      await scanRootDirectory(fullPath, root, scanned)
      continue
    }
    if (!entry.isFile()) continue

    const subRelative = path.relative(root.dir, fullPath).split(path.sep).join('/')
    const ext = path.extname(entry.name).toLowerCase()
    const classified = classifyAssetSubPath(subRelative, ext)
    if (!classified) continue

    const bucket =
      classified.type === 'image' ? scanned.images[classified.imageKey] : scanned[classified.type]

    try {
      const stat = await fs.promises.stat(fullPath)
      bucket.files.push({
        localPath: fullPath,
        archivePath: `${root.archivePrefix}/${subRelative}`,
        size: stat.size,
        categoryLabel: classified.label,
      })
      bucket.size += stat.size
    } catch {
      // Skip unreadable files
    }
  }
}

export async function scanAllBackupAssets(): Promise<ScannedBackupAssets> {
  const scanned = createEmptyScannedAssets()
  for (const root of getAssetScanRoots()) {
    if (!fs.existsSync(root.dir)) continue
    await scanRootDirectory(root.dir, root, scanned)
  }
  return scanned
}

export async function collectSelectedBackupAssets(
  options: BackupContentOptions,
  scanned?: ScannedBackupAssets,
): Promise<BackupAssetFile[]> {
  const resolved = scanned ?? (await scanAllBackupAssets())
  const selected: BackupAssetFile[] = []

  for (const key of BACKUP_IMAGE_KEYS) {
    if (options.images[key]) {
      selected.push(...resolved.images[key].files)
    }
  }
  if (options.video) {
    selected.push(...resolved.video.files)
  }
  if (options.audio) {
    selected.push(...resolved.audio.files)
  }
  if (options.font) {
    selected.push(...resolved.font.files)
  }

  return selected
}

export async function copyBackupAssetFiles(
  files: BackupAssetFile[],
  backupRootDir: string,
): Promise<void> {
  for (const file of files) {
    const destPath = path.join(backupRootDir, ...file.archivePath.split('/'))
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
    await fs.promises.copyFile(file.localPath, destPath)
  }
}

export async function mergeBackupAssetDirectory(
  extractedDir: string,
  targetDir: string,
): Promise<void> {
  if (!fs.existsSync(extractedDir)) return

  const entries = await fs.promises.readdir(extractedDir, { withFileTypes: true })
  if (fs.existsSync(targetDir)) {
    const backupDir = `${targetDir}.bak`
    await fs.promises.rm(backupDir, { recursive: true, force: true })
    for (const entry of entries) {
      const existingPath = path.join(targetDir, entry.name)
      if (!fs.existsSync(existingPath)) continue
      const backupEntryPath = path.join(backupDir, entry.name)
      await fs.promises.mkdir(path.dirname(backupEntryPath), { recursive: true })
      await fs.promises.cp(existingPath, backupEntryPath, { recursive: true })
    }
  }

  await fs.promises.mkdir(targetDir, { recursive: true })
  await fs.promises.cp(extractedDir, targetDir, { recursive: true, force: true })
}

export function isSafeBackupSettingsFileName(name: string): boolean {
  if (!name || name === '.' || name === '..') return false
  if (name.includes('/') || name.includes('\\')) return false
  if (name.startsWith('.')) return false
  const lower = name.toLowerCase()
  return !lower.endsWith('.bak') && !lower.endsWith('.tmp')
}

export function resolveBackupSettingsTargetPath(name: string): string {
  return name === 'custom.css' ? getCustomCssPath() : path.join(getDataSettingsDir(), name)
}

export async function collectBackupSettingsFiles(): Promise<BackupAssetFile[]> {
  const files: BackupAssetFile[] = []
  const seenArchivePaths = new Set<string>()
  const settingsDir = getDataSettingsDir()

  if (fs.existsSync(settingsDir)) {
    const entries = await fs.promises.readdir(settingsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !isSafeBackupSettingsFileName(entry.name)) continue
      const localPath = path.join(settingsDir, entry.name)
      try {
        const stat = await fs.promises.stat(localPath)
        const archivePath = `settings/${entry.name}`
        seenArchivePaths.add(archivePath)
        files.push({
          localPath,
          archivePath,
          size: stat.size,
          categoryLabel: '设置文件',
        })
      } catch {
        // Skip unreadable settings files
      }
    }
  }

  const customCssPath = getCustomCssPath()
  if (!seenArchivePaths.has('settings/custom.css') && fs.existsSync(customCssPath)) {
    try {
      const stat = await fs.promises.stat(customCssPath)
      if (stat.isFile()) {
        files.push({
          localPath: customCssPath,
          archivePath: 'settings/custom.css',
          size: stat.size,
          categoryLabel: '设置文件',
        })
      }
    } catch {
      // Skip unreadable custom.css
    }
  }

  return files
}

export async function restoreBackupSettingsDirectory(extractedSettingsDir: string): Promise<void> {
  if (!fs.existsSync(extractedSettingsDir)) return

  const entries = await fs.promises.readdir(extractedSettingsDir, { withFileTypes: true })
  const validFiles = entries.filter(
    (entry) => entry.isFile() && isSafeBackupSettingsFileName(entry.name),
  )
  if (validFiles.length === 0) return

  const backupDir = `${getDataSettingsDir()}.bak`
  await fs.promises.rm(backupDir, { recursive: true, force: true })

  for (const entry of validFiles) {
    const sourcePath = path.join(extractedSettingsDir, entry.name)
    const destPath = resolveBackupSettingsTargetPath(entry.name)

    if (fs.existsSync(destPath)) {
      const backupFilePath = path.join(backupDir, entry.name)
      await fs.promises.mkdir(path.dirname(backupFilePath), { recursive: true })
      await fs.promises.copyFile(destPath, backupFilePath)
    }

    await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
    await fs.promises.copyFile(sourcePath, destPath)
  }
}
