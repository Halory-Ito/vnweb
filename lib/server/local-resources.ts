import fs from 'node:fs/promises'
import path from 'node:path'

import { collectLocalResourceReferences } from './local-resource-references'
import {
  LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY,
  LIBRARY_FOLDER_LOGO_DIRECTORY,
} from '@/lib/library-folder-logo-path'

import type {
  ImageUsage,
  LocalResourceItem,
  LocalResourceSummary,
  ResourceCategory,
} from '@/types/local-resource'

const imageFolderUsage = new Map<string, ImageUsage>([
  ['cover', 'cover'],
  ['ost', 'cover'],
  ['characters', 'character'],
  ['logo', 'logo'],
  [LIBRARY_FOLDER_LOGO_DIRECTORY, 'brand'],
  [LEGACY_LIBRARY_FOLDER_LOGO_DIRECTORY, 'brand'],
  ['bg', 'background'],
  ['icon', 'icon'],
  ['cg', 'cg'],
  ['memory', 'memory'],
])

export const EXTENSION_CATEGORY_MAP: Record<string, ResourceCategory> = {
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.webp': 'image',
  '.gif': 'image',
  '.svg': 'image',
  '.ico': 'image',
  '.bmp': 'image',
  '.avif': 'image',
  '.mp4': 'video',
  '.webm': 'video',
  '.mkv': 'video',
  '.mov': 'video',
  '.avi': 'video',
  '.m4v': 'video',
  '.mp3': 'audio',
  '.flac': 'audio',
  '.wav': 'audio',
  '.ogg': 'audio',
  '.m4a': 'audio',
  '.aac': 'audio',
  '.opus': 'audio',
  '.ttf': 'font',
  '.otf': 'font',
  '.ttc': 'font',
  '.woff': 'font',
  '.woff2': 'font',
}

type ScanRoot = {
  dir: string
  relativePrefix: string
  urlPrefix: string
  defaultFolder: string
}

export const getScanRoots = (): ScanRoot[] => {
  const cwd = process.cwd()
  return [
    {
      dir: path.join(cwd, 'assets'),
      relativePrefix: 'assets',
      urlPrefix: '/assets',
      defaultFolder: 'assets',
    },
    {
      dir: path.join(cwd, 'public', 'fonts'),
      relativePrefix: 'public/fonts',
      urlPrefix: '/fonts',
      defaultFolder: 'public/fonts',
    },
  ]
}

const toPosixPath = (value: string) => value.split(path.sep).join('/')

const encodeUrlSegments = (relativeSubPath: string) =>
  relativeSubPath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

async function scanDirectory(
  currentDir: string,
  root: ScanRoot,
  items: LocalResourceItem[],
): Promise<void> {
  let entries
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      await scanDirectory(fullPath, root, items)
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const ext = path.extname(entry.name).toLowerCase()
    const category = EXTENSION_CATEGORY_MAP[ext]
    if (!category) {
      continue
    }

    try {
      const stat = await fs.stat(fullPath)
      const subRelative = toPosixPath(path.relative(root.dir, fullPath))
      const relativePath = `${root.relativePrefix}/${subRelative}`
      const firstSegment = subRelative.includes('/')
        ? subRelative.split('/')[0]
        : root.defaultFolder

      items.push({
        id: relativePath,
        name: entry.name,
        relativePath,
        url: `${root.urlPrefix}/${encodeUrlSegments(subRelative)}`,
        category,
        folder: root.relativePrefix === 'public/fonts' ? 'public/fonts' : firstSegment,
        extension: ext,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      })
    } catch {
      // Skip files that cannot be stat'd
    }
  }
}

function createEmptySummary(): LocalResourceSummary {
  return {
    totalCount: 0,
    totalSize: 0,
    categories: {
      image: { count: 0, size: 0 },
      video: { count: 0, size: 0 },
      audio: { count: 0, size: 0 },
      font: { count: 0, size: 0 },
    },
    imagesByUsage: {},
  }
}

export async function collectAllScannedResources() {
  const items: LocalResourceItem[] = []
  const roots = getScanRoots()

  const [, refs] = await Promise.all([
    (async () => {
      for (const root of roots) {
        await scanDirectory(root.dir, root, items)
      }
    })(),
    collectLocalResourceReferences(),
  ])

  for (const item of items) {
    if (item.category === 'image') {
      item.imageUsage = refs.get(item.relativePath) ?? imageFolderUsage.get(item.folder) ?? 'other'
    }
  }
  return { items, usedPaths: refs }
}

export function summarizeLocalResources(
  items: LocalResourceItem[],
  usedPaths: ReadonlyMap<string, unknown>,
) {
  const summary = createEmptySummary()
  const unusedSummary = createEmptySummary()

  function add(target: LocalResourceSummary, item: LocalResourceItem) {
    target.totalCount += 1
    target.totalSize += item.size
    target.categories[item.category].count += 1
    target.categories[item.category].size += item.size

    if (item.imageUsage) {
      const usage = (target.imagesByUsage[item.imageUsage] ??= { count: 0, size: 0 })
      usage.count += 1
      usage.size += item.size
    }
  }

  for (const item of items) {
    add(summary, item)
    if (!usedPaths.has(item.relativePath)) add(unusedSummary, item)
  }
  return { summary, unusedSummary }
}
