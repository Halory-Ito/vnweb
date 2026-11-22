import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultDatabaseUrl = 'file:./local.db'
const settingsPath = resolve('data', 'settings', 'general.json')

function readDatabaseUrl() {
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

export const databaseUrl = readDatabaseUrl()

export function getDbPath() {
  if (!databaseUrl.startsWith('file:')) {
    throw new Error('此操作需要本地 SQLite 数据库')
  }
  const filename = decodeURIComponent(databaseUrl.slice(5).split(/[?#]/, 1)[0])
  if (!filename || filename === ':memory:') {
    throw new Error('此操作需要本地 SQLite 数据库文件')
  }
  return filename.startsWith('//') ? fileURLToPath(databaseUrl) : resolve(filename)
}
