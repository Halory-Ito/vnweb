import fs from 'node:fs'
import path from 'node:path'

import { getDataSettingsDir } from './runtime-paths.mjs'

export const DEFAULT_APP_PORT = 8999
export const MIN_APP_PORT = 1024
export const MAX_APP_PORT = 65535

export function parseValidPort(value) {
  if (typeof value === 'boolean' || value === null || value === undefined) return null
  if (typeof value === 'string' && !value.trim()) return null
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(num) || num < MIN_APP_PORT || num > MAX_APP_PORT) {
    return null
  }
  return num
}

function parseEnvPort(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  const num = Number(value.trim())
  if (!Number.isInteger(num) || num < 1 || num > MAX_APP_PORT) {
    return null
  }
  return num
}

export function readConfiguredAppPortSync() {
  const settingsPath = path.join(getDataSettingsDir(), 'general.json')
  try {
    const content = fs.readFileSync(settingsPath, 'utf8').replace(/^\uFEFF/, '')
    const parsed = JSON.parse(content)
    const port = parsed && typeof parsed === 'object' ? parsed?.app?.port : undefined
    return parseValidPort(port) ?? DEFAULT_APP_PORT
  } catch {
    return DEFAULT_APP_PORT
  }
}

export function resolveServerPortSync() {
  return (
    parseEnvPort(process.env.VNWEB_PORT) ??
    parseEnvPort(process.env.PORT) ??
    readConfiguredAppPortSync() ??
    DEFAULT_APP_PORT
  )
}
