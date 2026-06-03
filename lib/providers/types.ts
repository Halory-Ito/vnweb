// 向后兼容：从统一插件类型重新导出
export type {
  BulkImportResult,
  GameSearchItem,
  GameSearchResult,
  ProviderCapability,
  ProviderPlugin as GameProviderPlugin,
  SteamOwnedGameItem,
  ThirdPartyLibraryGameItem,
} from '@/lib/plugins/types'
