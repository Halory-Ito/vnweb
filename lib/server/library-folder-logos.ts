import { and, eq, isNotNull, like, sql } from 'drizzle-orm'

import { readConfig, updateConfigSection } from './config-rw'
import {
  migrateLegacyLibraryLogoDirectory,
  migrateLibraryLogoSource,
} from './library-folder-logo-files'
import { LibraryFolderLogoTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import {
  LEGACY_LIBRARY_FOLDER_LOGO_URL_PREFIX,
  toBrandLogoUrl,
} from '@/lib/library-folder-logo-path'
import { isAppearanceImageSource } from '@/lib/settings/appearance-image'

export function isDeveloperFolderHref(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/game/home?'))
    return false

  const params = new URLSearchParams(value.slice('/game/home?'.length))
  return (
    params.size === 2 &&
    params.get('group') === 'developer' &&
    Boolean(params.get('folder')?.trim())
  )
}

export function isCollectionFolderHref(value: string) {
  const match = /^\/game\/collection\/([1-9]\d*)$/.exec(value)
  return match !== null && Number.isSafeInteger(Number(match[1]))
}

let schemaReady: Promise<void> | undefined

async function initialize() {
  await db.run(
    sql`CREATE TABLE IF NOT EXISTS library_folder_logo (href TEXT PRIMARY KEY NOT NULL, source TEXT)`,
  )
  await migrateLegacyLibraryLogoDirectory()
  const config = await readConfig()
  const legacy = (
    config.settings as { appearance?: { layout?: { folderLogos?: Record<string, unknown> } } }
  )?.appearance?.layout?.folderLogos

  const remainingLegacy = { ...legacy }
  let migratedLegacy = false
  for (const [href, source] of Object.entries(legacy ?? {})) {
    if (isDeveloperFolderHref(href) && isAppearanceImageSource(source)) {
      const normalizedSource = toBrandLogoUrl(source)
      const [existing] = await db
        .select({ href: LibraryFolderLogoTable.href })
        .from(LibraryFolderLogoTable)
        .where(eq(LibraryFolderLogoTable.href, href))
      if (!existing) {
        await db
          .insert(LibraryFolderLogoTable)
          .values({ href, source: await migrateLibraryLogoSource(normalizedSource) })
          .onConflictDoNothing()
      }
      if (/^data:/i.test(source)) {
        delete remainingLegacy[href]
        migratedLegacy = true
      } else if (normalizedSource !== source) {
        remainingLegacy[href] = normalizedSource
        migratedLegacy = true
      }
    }
  }

  const embedded = await db
    .select()
    .from(LibraryFolderLogoTable)
    .where(like(LibraryFolderLogoTable.source, 'data:%'))
  for (const { href, source } of embedded) {
    if (!source) continue
    const file = await migrateLibraryLogoSource(source)
    await db
      .update(LibraryFolderLogoTable)
      .set({ source: file })
      .where(and(eq(LibraryFolderLogoTable.href, href), eq(LibraryFolderLogoTable.source, source)))
  }

  const legacyFiles = await db
    .select()
    .from(LibraryFolderLogoTable)
    .where(like(LibraryFolderLogoTable.source, `${LEGACY_LIBRARY_FOLDER_LOGO_URL_PREFIX}%`))
  for (const { href, source } of legacyFiles) {
    if (!source) continue
    const nextSource = toBrandLogoUrl(source)
    await db
      .update(LibraryFolderLogoTable)
      .set({ source: nextSource })
      .where(and(eq(LibraryFolderLogoTable.href, href), eq(LibraryFolderLogoTable.source, source)))
  }

  if (migratedLegacy) {
    await updateConfigSection(['settings', 'appearance', 'layout', 'folderLogos'], remainingLegacy)
  }
}

function ensureSchema() {
  schemaReady ??= initialize().catch((error) => {
    schemaReady = undefined
    throw error
  })
  return schemaReady
}

export async function readLibraryFolderLogos() {
  await ensureSchema()
  const rows = await db
    .select()
    .from(LibraryFolderLogoTable)
    .where(isNotNull(LibraryFolderLogoTable.source))
  return Object.fromEntries(
    rows.flatMap(({ href, source }) => (source ? [[href, source]] : [])),
  ) as Record<string, string>
}

export async function writeLibraryFolderLogo(href: string, source: string | null) {
  await ensureSchema()
  // A null source records a removal so legacy settings cannot restore the image.
  await db.insert(LibraryFolderLogoTable).values({ href, source }).onConflictDoUpdate({
    target: LibraryFolderLogoTable.href,
    set: { source },
  })
}
