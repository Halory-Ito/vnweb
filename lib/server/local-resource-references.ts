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
  LibraryFolderLogoTable,
} from '@/db/schema'
import { db } from '@/lib/drizzle'
import { getCustomCssPath, getDataSettingsDir } from '@/lib/server/runtime-paths.mjs'

import type { ImageUsage } from '@/types/local-resource'

type References = Map<string, ImageUsage | undefined>

const embeddedPath = /(?:^|[\s"'\x60<>()])((?:\/?(?:assets|fonts)\/)[^\s"'\x60<>()\\]+)/g

function normalizeResourceRef(raw: string) {
  const value = raw.split(/[?#]/)[0]?.trim() ?? ''
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    // Preserve filenames containing literal percent signs.
  }
  const normalized = decoded.replace(/^\/+/, '').replace(/\\/g, '/')
  if (normalized.startsWith('assets/')) return normalized
  if (normalized.startsWith('fonts/')) return `public/${normalized}`
  return null
}

function collectRefs(value: unknown, refs: References, usage?: ImageUsage) {
  if (typeof value === 'string') {
    const add = (raw: string) => {
      const ref = normalizeResourceRef(raw)
      if (ref && (!refs.has(ref) || (usage && !refs.get(ref)))) refs.set(ref, usage)
    }
    add(value)
    for (const match of value.matchAll(embeddedPath)) add(match[1])
    return
  }

  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectRefs(entry, refs, usage)
  }
}

async function allowMissingTable<T>(query: PromiseLike<T[]>) {
  try {
    return await query
  } catch (error) {
    const message = error instanceof Error ? (error.cause ?? error) : error
    if (/no such table/i.test(String(message))) return []
    throw error
  }
}

export async function collectLocalResourceReferences() {
  const refs: References = new Map()
  const [games, pvs, osts, ostSongs, characters, memories, cgs, guides, guideSteps, logos] =
    await Promise.all([
      allowMissingTable(
        db
          .select({
            cover: GameInfoTable.cover,
            icon: GameInfoTable.icon,
            bg: GameInfoTable.bg,
            logo: GameInfoTable.logo,
            summary: GameInfoTable.summary,
          })
          .from(GameInfoTable),
      ),
      allowMissingTable(db.select({ url: GamePvTable.url }).from(GamePvTable)),
      allowMissingTable(
        db
          .select({ cover: GameOstTable.cover, resource: GameOstTable.resource })
          .from(GameOstTable),
      ),
      allowMissingTable(db.select().from(GameOstSongsTable)),
      allowMissingTable(
        db
          .select({ image: CharacterTable.imageUrl, description: CharacterTable.description })
          .from(CharacterTable),
      ),
      allowMissingTable(
        db
          .select({ image: GameMemoryTable.imageUrl, description: GameMemoryTable.description })
          .from(GameMemoryTable),
      ),
      allowMissingTable(
        db.select({ url: CGTable.url, thumbnail: CGTable.thumbnail }).from(CGTable),
      ),
      allowMissingTable(db.select().from(GameGuideTable)),
      allowMissingTable(db.select().from(GuideStepTable)),
      allowMissingTable(
        db.select({ source: LibraryFolderLogoTable.source }).from(LibraryFolderLogoTable),
      ),
    ])

  for (const game of games) {
    collectRefs(game.cover, refs, 'cover')
    collectRefs(game.icon, refs, 'icon')
    collectRefs(game.bg, refs, 'background')
    collectRefs(game.logo, refs, 'logo')
    collectRefs(game.summary, refs)
  }
  for (const { cover, resource } of osts) {
    collectRefs(cover, refs, 'cover')
    collectRefs(resource, refs)
  }
  for (const { image, description } of characters) {
    collectRefs(image, refs, 'character')
    collectRefs(description, refs)
  }
  for (const { image, description } of memories) {
    collectRefs(image, refs, 'memory')
    collectRefs(description, refs)
  }
  collectRefs(cgs, refs, 'cg')
  collectRefs(logos, refs, 'brand')
  collectRefs([pvs, ostSongs, guides, guideSteps], refs)

  const configFiles = [
    path.join(getDataSettingsDir(), 'appearance.json'),
    path.join(getDataSettingsDir(), 'general.json'),
    getCustomCssPath(),
  ]
  for (const filePath of configFiles) {
    try {
      const text = await fs.readFile(/*turbopackIgnore: true*/ filePath, 'utf8')
      collectRefs(filePath.endsWith('.json') ? JSON.parse(text) : text, refs)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }

  return refs
}
