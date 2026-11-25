import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { getDataDir, getDataSettingsDir } from './runtime-paths.mjs'

const defaultDatabaseUrl = 'file:./local.db'

function readRawDatabaseUrl() {
  const envUrl = process.env.VNWEB_DB_URL?.trim()
  if (envUrl) return envUrl

  const settingsPath = join(getDataSettingsDir(), 'general.json')
  let contents
  try {
    contents = readFileSync(settingsPath, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return defaultDatabaseUrl
    }
    throw error
  }

  const settings = JSON.parse(contents.replace(/^\uFEFF/, ''))
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    throw new Error('general.json 必须包含一个设置对象')
  }
  if (settings.dbFileName === undefined) return defaultDatabaseUrl
  if (typeof settings.dbFileName !== 'string' || !settings.dbFileName.trim()) {
    throw new Error('general.json 的 dbFileName 必须是非空字符串')
  }
  return settings.dbFileName.trim()
}

export function getDatabaseUrl() {
  const rawUrl = readRawDatabaseUrl()
  if (!rawUrl.startsWith('file:')) {
    return rawUrl
  }

  const rest = rawUrl.slice(5)
  const match = /^([^?#]*)(.*)$/.exec(rest)
  const rawPathPart = match?.[1] ?? ''
  const suffix = match?.[2] ?? ''

  if (!rawPathPart || rawPathPart === ':memory:') {
    return rawUrl
  }

  if (rawPathPart.startsWith('//')) {
    const resolvedPath = fileURLToPath(`file:${rawPathPart}`)
    return `${pathToFileURL(resolvedPath).href}${suffix}`
  }

  const decodedPath = decodeURIComponent(rawPathPart)
  const resolvedPath = resolve(getDataDir(), decodedPath)
  return `${pathToFileURL(resolvedPath).href}${suffix}`
}

export const databaseUrl = getDatabaseUrl()

export function getDbPath() {
  const url = getDatabaseUrl()
  if (!url.startsWith('file:')) {
    throw new Error('此操作需要本地 SQLite 数据库')
  }
  const filename = url.slice(5).split(/[?#]/, 1)[0]
  if (!filename || filename === ':memory:') {
    throw new Error('此操作需要本地 SQLite 数据库文件')
  }
  return filename.startsWith('//')
    ? fileURLToPath(`file:${filename}`)
    : resolve(getDataDir(), decodeURIComponent(filename))
}
