// 向后兼容：从统一插件系统重新导出
export type {
  BulkImportResult,
  GameSearchItem,
  GameSearchResult,
  ProviderCapability,
  SteamOwnedGameItem,
  ThirdPartyLibraryGameItem,
} from '@/lib/plugins/types'

export type { ProviderPlugin as GameProviderPlugin } from '@/lib/plugins/types'

export {
  getAccountBindProviders,
  getAllProviders,
  getBulkImportProviders,
  getEnabledProviders,
  getManualSearchProviderOptions,
  getProviderById,
  getProvidersByCapability,
  isProviderPluginEnabled,
  toggleProvider,
} from './registry'
