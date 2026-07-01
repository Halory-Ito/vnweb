import { setActiveFeaturePlugins } from './hooks'
import {
  isPluginEnabled,
  readPluginSettings,
  setPluginEnabled,
} from './settings'

import type {
  AnyPlugin,
  CharacterProviderPlugin,
  FeaturePlugin,
  HookId,
  ProviderCapability,
  ProviderPlugin,
} from './types'

// ── 内置插件注册表 ────────────────────────────────────────
const builtinPlugins: AnyPlugin[] = []
const externalPlugins: AnyPlugin[] = []
const characterProviders: CharacterProviderPlugin[] = []

// ═══════════════════════════════════════════════════════════
//  注册接口
// ═══════════════════════════════════════════════════════════

/** 注册一个内置插件 */
export function registerPlugin(plugin: AnyPlugin) {
  if (!builtinPlugins.some((p) => p.id === plugin.id)) {
    builtinPlugins.push(plugin)
  }
}

/** 注册一个外部加载的插件 */
export function registerExternalPlugin(plugin: AnyPlugin) {
  if (!externalPlugins.some((p) => p.id === plugin.id)) {
    externalPlugins.push(plugin)
  }
}

/** 获取所有插件（内置 + 外部 + 角色数据源） */
function allPlugins(): AnyPlugin[] {
  return [...builtinPlugins, ...externalPlugins, ...characterProviders]
}

// ═══════════════════════════════════════════════════════════
//  查询接口
// ═══════════════════════════════════════════════════════════

/** 获取所有插件（含启用状态） */
export function getAllPlugins(): Array<AnyPlugin & { enabled: boolean }> {
  const settings = readPluginSettings()
  return allPlugins().map((p) => ({
    ...p,
    enabled: isPluginEnabled(p.id, settings),
  }))
}

/** 获取所有已启用的插件 */
export function getEnabledPlugins(): AnyPlugin[] {
  const settings = readPluginSettings()
  return allPlugins().filter((p) => isPluginEnabled(p.id, settings))
}

/** 根据 ID 获取插件 */
export function getPlugin(id: string): AnyPlugin | undefined {
  return allPlugins().find((p) => p.id === id)
}

/** 获取所有已启用的数据源插件 */
export function getEnabledProviders(): ProviderPlugin[] {
  return getEnabledPlugins().filter(
    (p): p is ProviderPlugin => p.type === 'provider',
  )
}

/** 获取所有已启用的功能插件 */
export function getEnabledFeatures(): FeaturePlugin[] {
  return getEnabledPlugins().filter(
    (p): p is FeaturePlugin => p.type === 'feature',
  )
}

/** 获取所有数据源插件（含启用状态） */
export function getAllProviders(): Array<
  ProviderPlugin & { enabled: boolean }
> {
  const settings = readPluginSettings()
  return allPlugins()
    .filter((p): p is ProviderPlugin => p.type === 'provider')
    .map((p) => ({
      ...p,
      enabled: isPluginEnabled(p.id, settings),
    }))
}

/** 获取具有指定能力的已启用数据源插件 */
export function getProvidersByCapability(
  capability: ProviderCapability,
): ProviderPlugin[] {
  return getEnabledProviders().filter((p) =>
    p.capabilities.includes(capability),
  )
}

/** 获取用于手动搜索的选项列表 */
export function getManualSearchProviderOptions() {
  return getProvidersByCapability('manual-search').map((p) => ({
    value: p.id,
    label: p.name,
  }))
}

/** 获取支持批量导入的已启用提供商 */
export function getBulkImportProviders() {
  return getProvidersByCapability('bulk-import')
}

/** 获取支持账号绑定的已启用提供商 */
export function getAccountBindProviders() {
  return getProvidersByCapability('account-bind')
}

// ═══════════════════════════════════════════════════════════
//  角色数据源插件接口
// ═══════════════════════════════════════════════════════════

/** 注册一个角色数据源插件 */
export function registerCharacterProvider(plugin: CharacterProviderPlugin) {
  if (!characterProviders.some((p) => p.id === plugin.id)) {
    characterProviders.push(plugin)
  }
}

/** 获取所有已注册的角色数据源插件 */
export function getCharacterProviders(): CharacterProviderPlugin[] {
  return [...characterProviders]
}

/** 根据 sourceId 获取角色数据源插件 */
export function getCharacterProvider(
  sourceId: string,
): CharacterProviderPlugin | undefined {
  return characterProviders.find((p) => p.sourceId === sourceId)
}

/** 获取所有已启用的角色数据源插件 */
export function getEnabledCharacterProviders(): CharacterProviderPlugin[] {
  const settings = readPluginSettings()
  return characterProviders.filter((p) => isPluginEnabled(p.id, settings))
}

// ═══════════════════════════════════════════════════════════
//  启用/禁用接口
// ═══════════════════════════════════════════════════════════

/** 切换插件启用状态 */
export async function togglePlugin(
  id: string,
  enabled: boolean,
): Promise<void> {
  const plugin = getPlugin(id)
  if (!plugin) return

  if (enabled && plugin.type === 'feature' && plugin.onActivate) {
    await plugin.onActivate()
  }
  if (!enabled && plugin.type === 'feature' && plugin.onDeactivate) {
    await plugin.onDeactivate()
  }

  setPluginEnabled(id, enabled)
  syncFeaturePlugins()
}

/** 检查指定插件是否启用 */
export function isPluginActive(id: string): boolean {
  return isPluginEnabled(id)
}

// ═══════════════════════════════════════════════════════════
//  内部同步
// ═══════════════════════════════════════════════════════════

/** 同步已启用的功能插件到 Hook 执行器 */
function syncFeaturePlugins() {
  setActiveFeaturePlugins(getEnabledFeatures())
}

/** 初始化：注册内置插件后调用，同步状态 */
export function initializePlugins() {
  syncFeaturePlugins()
}

// ── 自动注册内置角色数据源插件（模块加载时同步执行） ──────
// 角色插件文件仅依赖 @/lib/plugins/types（纯类型），不依赖 registry.ts，无循环依赖
import {
  bangumiCharacterProvider,
  vndbCharacterProvider,
  ymgalCharacterProvider,
} from '@/lib/providers/characters'

registerCharacterProvider(vndbCharacterProvider)
registerCharacterProvider(bangumiCharacterProvider)
registerCharacterProvider(ymgalCharacterProvider)
