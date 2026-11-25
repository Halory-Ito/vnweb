import path from 'node:path'

function resolveEnvDir(envValue) {
  if (typeof envValue !== 'string') return null
  const trimmed = envValue.trim()
  return trimmed ? path.resolve(trimmed) : null
}

export function getAppRootDir() {
  return resolveEnvDir(process.env.VNWEB_APP_DIR) ?? process.cwd()
}

export function getDataDir() {
  return resolveEnvDir(process.env.VNWEB_DATA_DIR) ?? process.cwd()
}

export function getDataExampleDir() {
  return path.join(getAppRootDir(), 'data', 'example')
}

export function getDrizzleMigrationsDir() {
  return path.join(getAppRootDir(), 'drizzle')
}

export function getAppPublicDir() {
  return path.join(getAppRootDir(), 'public')
}

export function getAppCustomCssPath() {
  return path.join(getAppRootDir(), 'app', 'custom.css')
}

export function getDataSettingsDir() {
  return path.join(getDataDir(), 'data', 'settings')
}

export function getDataServicesDir() {
  return path.join(getDataDir(), 'data', 'services')
}

export function getAssetsDir() {
  return path.join(getDataDir(), 'assets')
}

export function getLegacyPublicAssetsDir() {
  return path.join(getDataDir(), 'public', 'assets')
}

export function getUserPublicDir() {
  return path.join(getDataDir(), 'public')
}

export function getTempDir() {
  return path.join(getDataDir(), 'temp-backup')
}

export function getCustomCssPath() {
  if (path.resolve(getDataDir()) !== path.resolve(getAppRootDir())) {
    return path.join(getDataSettingsDir(), 'custom.css')
  }
  return getAppCustomCssPath()
}

export function getLegacyAppConfigPath() {
  return path.join(getDataDir(), 'app', 'config.json')
}

export function getLegacyWebdavConfigPath() {
  return path.join(getDataDir(), 'app', 'webdav-config.json')
}
