import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { registerExternalPlugin } from './registry'

import type { AnyPlugin, PluginManifest } from './types'

const PLUGINS_DIR = resolve(process.cwd(), 'plugins')

function isValidManifest(raw: unknown): raw is PluginManifest {
  if (!raw || typeof raw !== 'object') return false
  const m = raw as Record<string, unknown>
  return (
    typeof m.id === 'string' &&
    typeof m.name === 'string' &&
    typeof m.description === 'string' &&
    typeof m.version === 'string' &&
    typeof m.icon === 'string' &&
    (m.type === 'provider' || m.type === 'feature') &&
    typeof m.defaultEnabled === 'boolean'
  )
}

/**
 * 扫描 plugins/ 目录，动态加载所有外部插件。
 * 每个插件是一个文件夹，包含：
 *   - manifest.json  — 插件元数据
 *   - index.mjs      — 入口模块（default export 为插件对象）
 */
export async function loadExternalPlugins(): Promise<string[]> {
  if (!existsSync(PLUGINS_DIR)) return []

  const loaded: string[] = []
  const entries = readdirSync(PLUGINS_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const pluginDir = join(PLUGINS_DIR, entry.name)
    const manifestPath = join(pluginDir, 'manifest.json')
    const entryPath = join(pluginDir, 'index.mjs')

    if (!existsSync(manifestPath) || !existsSync(entryPath)) continue

    try {
      const rawManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      if (!isValidManifest(rawManifest)) {
        console.warn(`Plugin "${entry.name}": invalid manifest, skipping`)
        continue
      }

      const module = await eval(`import(${JSON.stringify(entryPath)})`)
      const plugin: AnyPlugin | undefined =
        module.default ?? module.plugin ?? undefined

      if (!plugin || typeof plugin !== 'object' || plugin.id !== rawManifest.id) {
        console.warn(
          `Plugin "${entry.name}": entry module does not export a valid plugin, skipping`,
        )
        continue
      }

      registerExternalPlugin(plugin)
      loaded.push(plugin.id)
      console.log(`Loaded external plugin: ${plugin.id} v${plugin.version}`)
    } catch (error) {
      console.error(`Failed to load plugin "${entry.name}":`, error)
    }
  }

  return loaded
}
