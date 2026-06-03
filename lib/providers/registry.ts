import {
  isProviderEnabled,
  notifyProviderSettingsChanged,
  readProviderSettings,
  setProviderEnabled,
  writeProviderSettings,
} from '@/lib/settings/provider-settings'

import { bangumiProvider } from './bangumi-provider'
import { steamProvider } from './steam-provider'
import { steamgriddbProvider } from './steamgriddb-provider'
import { vndbProvider } from './vndb-provider'
import { ymgalProvider } from './ymgal-provider'

import type { GameProviderPlugin, ProviderCapability } from './types'

// ── 内置提供商注册表 ──────────────────────────────────────
const builtinProviders: GameProviderPlugin[] = [
  bangumiProvider,
  vndbProvider,
  steamProvider,
  steamgriddbProvider,
  ymgalProvider,
]

// ── 查询接口 ──────────────────────────────────────────────

/** 获取所有已注册的提供商（含启用状态） */
export function getAllProviders(): Array<
  GameProviderPlugin & { enabled: boolean }
> {
  const settings = readProviderSettings()
  return builtinProviders.map((provider) => ({
    ...provider,
    enabled: isProviderEnabled(provider.id, settings),
  }))
}

/** 获取所有已启用的提供商 */
export function getEnabledProviders(): GameProviderPlugin[] {
  const settings = readProviderSettings()
  return builtinProviders.filter((p) => isProviderEnabled(p.id, settings))
}

/** 根据 ID 获取提供商（忽略启用状态） */
export function getProviderById(
  id: string,
): GameProviderPlugin | undefined {
  return builtinProviders.find((p) => p.id === id)
}

/** 获取具有指定能力的已启用提供商 */
export function getProvidersByCapability(
  capability: ProviderCapability,
): GameProviderPlugin[] {
  return getEnabledProviders().filter((p) =>
    p.capabilities.includes(capability),
  )
}

/** 检查指定提供商是否启用 */
export function isProviderPluginEnabled(id: string): boolean {
  return isProviderEnabled(id)
}

/** 切换提供商启用状态 */
export function toggleProvider(id: string, enabled: boolean): void {
  setProviderEnabled(id, enabled)
}

/** 获取提供商用于手动搜索的选项列表（仅已启用的） */
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
