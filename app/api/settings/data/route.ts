import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  CGTable,
  CharacterTable,
  GameGuideTable,
  GameInfoTable,
  GameMemoryTable,
  GameOstSongsTable,
  GameOstTable,
  GamePvTable,
  GuideStepTable,
} from '@/db/schema'
import { db } from '@/lib/drizzle'

type ResourceCategory = 'image' | 'video' | 'audio' | 'font'

type LocalResourceItem = {
  id: string
  name: string
  relativePath: string
  url: string
  category: ResourceCategory
  folder: string
  extension: string
  size: number
  modifiedAt: string
}

type CategorySummary = {
  count: number
  size: number
}

const EXTENSION_CATEGORY_MAP: Record<string, ResourceCategory> = {
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

const getScanRoots = (): ScanRoot[] => {
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

const RESOURCE_PATH_REGEX = /(?:\/?(?:assets|fonts)\/[^\s"'`<>()\\]+)/g

function normalizeResourceRef(raw: string): string | null {
  const cleaned = raw.split(/[?#]/)[0]?.trim()
  if (!cleaned) return null

  let decoded = cleaned
  try {
    decoded = decodeURIComponent(cleaned)
  } catch {
    // Keep original string if URI decoding fails
  }

  const normalized = decoded.replace(/^\/+/, '').replace(/\\/g, '/')
  if (normalized.startsWith('assets/')) return normalized
  if (normalized.startsWith('fonts/')) return `public/${normalized}`
  return null
}

function collectRefsFromValue(value: unknown, usedPaths: Set<string>) {
  if (typeof value === 'string') {
    const direct = normalizeResourceRef(value)
    if (direct) usedPaths.add(direct)

    const matches = value.match(RESOURCE_PATH_REGEX)
    if (matches) {
      for (const match of matches) {
        const ref = normalizeResourceRef(match)
        if (ref) usedPaths.add(ref)
      }
    }
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectRefsFromValue(item, usedPaths)
    }
    return
  }

  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) {
      collectRefsFromValue(entry, usedPaths)
    }
  }
}

async function collectUsedResourcePaths(): Promise<Set<string>> {
  const usedPaths = new Set<string>()

  const [games, pvs, osts, ostSongs, characters, memories, cgs, guides, guideSteps] =
    await Promise.all([
      db
        .select({
          cover: GameInfoTable.cover,
          icon: GameInfoTable.icon,
          bg: GameInfoTable.bg,
          logo: GameInfoTable.logo,
        })
        .from(GameInfoTable)
        .catch(() => []),
      db
        .select()
        .from(GamePvTable)
        .catch(() => []),
      db
        .select()
        .from(GameOstTable)
        .catch(() => []),
      db
        .select()
        .from(GameOstSongsTable)
        .catch(() => []),
      db
        .select()
        .from(CharacterTable)
        .catch(() => []),
      db
        .select()
        .from(GameMemoryTable)
        .catch(() => []),
      db
        .select()
        .from(CGTable)
        .catch(() => []),
      db
        .select()
        .from(GameGuideTable)
        .catch(() => []),
      db
        .select()
        .from(GuideStepTable)
        .catch(() => []),
    ])

  collectRefsFromValue(
    [games, pvs, osts, ostSongs, characters, memories, cgs, guides, guideSteps],
    usedPaths,
  )

  try {
    const configRaw = await fs.readFile(path.join(process.cwd(), 'app', 'config.json'), 'utf8')
    collectRefsFromValue(JSON.parse(configRaw), usedPaths)
  } catch {
    // Ignore missing or invalid config.json
  }

  return usedPaths
}

function createEmptySummary() {
  return {
    totalCount: 0,
    totalSize: 0,
    categories: {
      image: { count: 0, size: 0 },
      video: { count: 0, size: 0 },
      audio: { count: 0, size: 0 },
      font: { count: 0, size: 0 },
    } satisfies Record<ResourceCategory, CategorySummary>,
  }
}

async function collectAllScannedResources() {
  const items: LocalResourceItem[] = []
  const roots = getScanRoots()

  const [, usedPaths] = await Promise.all([
    (async () => {
      for (const root of roots) {
        await scanDirectory(root.dir, root, items)
      }
    })(),
    collectUsedResourcePaths(),
  ])

  return { items, usedPaths }
}

async function pruneEmptySubdirs(dir: string, isRoot = true): Promise<boolean> {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return false
  }

  let hasRemainingEntries = false
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const removed = await pruneEmptySubdirs(path.join(dir, entry.name), false)
      if (!removed) {
        hasRemainingEntries = true
      }
    } else {
      hasRemainingEntries = true
    }
  }

  if (!isRoot && !hasRemainingEntries) {
    try {
      await fs.rmdir(dir)
      return true
    } catch {
      return false
    }
  }

  return false
}

export async function GET() {
  try {
    const { items, usedPaths } = await collectAllScannedResources()

    items.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())

    const summary = createEmptySummary()
    const unusedSummary = createEmptySummary()

    for (const item of items) {
      summary.categories[item.category].count += 1
      summary.categories[item.category].size += item.size
      summary.totalCount += 1
      summary.totalSize += item.size

      if (!usedPaths.has(item.relativePath)) {
        unusedSummary.categories[item.category].count += 1
        unusedSummary.categories[item.category].size += item.size
        unusedSummary.totalCount += 1
        unusedSummary.totalSize += item.size
      }
    }

    return NextResponse.json({
      data: {
        summary,
        unusedSummary,
        items,
      },
    })
  } catch (error) {
    console.error('Failed to scan local static resources:', error)
    return NextResponse.json(
      { error: (error as Error).message || '读取本地静态资源失败' },
      { status: 500 },
    )
  }
}

const isPathWithinRoot = (targetPath: string, rootDir: string) => {
  const normalizedTarget = path.resolve(targetPath)
  const normalizedRoot = path.resolve(rootDir)
  const relative = path.relative(normalizedRoot, normalizedTarget)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      mode?: unknown
      paths?: unknown
    }

    let paths: string[] = []
    if (body.mode === 'unused') {
      const { items, usedPaths } = await collectAllScannedResources()
      paths = items
        .filter((item) => !usedPaths.has(item.relativePath))
        .map((item) => item.relativePath)

      if (paths.length === 0) {
        return NextResponse.json({
          data: {
            deleted: [],
            failed: [],
            freedBytes: 0,
          },
        })
      }
    } else {
      const rawPaths = Array.isArray(body.paths) ? body.paths : []
      paths = rawPaths
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())

      if (paths.length === 0) {
        return NextResponse.json({ error: '请选择要删除的资源文件' }, { status: 400 })
      }
    }

    const cwd = process.cwd()
    const allowedRoots = getScanRoots().map((root) => root.dir)
    const deleted: string[] = []
    const failed: Array<{ path: string; reason: string }> = []
    let freedBytes = 0

    for (const relativePath of paths) {
      const resolvedPath = path.resolve(cwd, relativePath)
      const isAllowed = allowedRoots.some((rootDir) => isPathWithinRoot(resolvedPath, rootDir))

      if (!isAllowed) {
        failed.push({ path: relativePath, reason: '不允许删除该目录外的文件' })
        continue
      }

      try {
        const stat = await fs.stat(resolvedPath)
        if (!stat.isFile()) {
          failed.push({ path: relativePath, reason: '目标不是文件' })
          continue
        }
        await fs.unlink(resolvedPath)
        deleted.push(relativePath)
        freedBytes += stat.size
      } catch (error) {
        failed.push({
          path: relativePath,
          reason: (error as Error).message || '删除失败',
        })
      }
    }

    if (deleted.length > 0) {
      for (const rootDir of allowedRoots) {
        await pruneEmptySubdirs(rootDir, true)
      }
    }

    return NextResponse.json({
      data: {
        deleted,
        failed,
        freedBytes,
      },
    })
  } catch (error) {
    console.error('Failed to delete local static resources:', error)
    return NextResponse.json(
      { error: (error as Error).message || '删除本地静态资源失败' },
      { status: 500 },
    )
  }
}
