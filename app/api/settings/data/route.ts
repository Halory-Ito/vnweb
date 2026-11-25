import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  collectAllScannedResources,
  getScanRoots,
  summarizeLocalResources,
} from '@/lib/server/local-resources'
import { getDataDir } from '@/lib/server/runtime-paths.mjs'

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

    const { summary, unusedSummary } = summarizeLocalResources(items, usedPaths)

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

    const dataDir = getDataDir()
    const allowedRoots = getScanRoots().map((root) => root.dir)
    const deleted: string[] = []
    const failed: Array<{ path: string; reason: string }> = []
    let freedBytes = 0

    for (const relativePath of paths) {
      const resolvedPath = path.resolve(dataDir, relativePath)
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
