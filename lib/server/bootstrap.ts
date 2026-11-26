import { constants } from 'node:fs'
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'

import { readConfig } from '@/lib/server/config-rw'
import { ensureDatabaseMigrated } from '@/lib/server/database-migrate'
import { ensureGameTrackingSchema } from '@/lib/server/game-tracking-schema'
import { getAssetsDir, getDataExampleDir, getDataSettingsDir } from '@/lib/server/runtime-paths.mjs'

const globalForBootstrap = globalThis as typeof globalThis & {
  __vnwebRuntimeInitPromise?: Promise<void>
}

export async function ensureDataSettingsSeeded(): Promise<{
  created: string[]
  existing: string[]
}> {
  const settingsDir = getDataSettingsDir()
  const assetsDir = getAssetsDir()
  const exampleDir = getDataExampleDir()

  await readConfig()
  await mkdir(settingsDir, { recursive: true })
  await mkdir(assetsDir, { recursive: true })

  const created: string[] = []
  const existing: string[] = []

  let entries
  try {
    entries = await readdir(exampleDir, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { created, existing }
    }
    throw error
  }

  const examples = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  for (const { name } of examples) {
    const target = path.join(settingsDir, name)
    try {
      await copyFile(path.join(exampleDir, name), target, constants.COPYFILE_EXCL)
      created.push(name)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      existing.push(name)
    }
  }

  return { created, existing }
}

export function ensureRuntimeInitialized(): Promise<void> {
  if (!globalForBootstrap.__vnwebRuntimeInitPromise) {
    globalForBootstrap.__vnwebRuntimeInitPromise = (async () => {
      await ensureDataSettingsSeeded()
      await ensureDatabaseMigrated()
      await ensureGameTrackingSchema()
    })().catch((error) => {
      globalForBootstrap.__vnwebRuntimeInitPromise = undefined
      throw error
    })
  }
  return globalForBootstrap.__vnwebRuntimeInitPromise
}
