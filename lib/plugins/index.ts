// ── 类型 ──────────────────────────────────────────────────
export type {
  AnyPlugin,
  CharacterProviderPlugin,
  FeaturePlugin,
  GameEnrichMetadataInput,
  GameEnrichMetadataOutput,
  HookHandler,
  HookId,
  HookTypeMap,
  NormalizedCharacterRow,
  PluginManifest,
  PluginType,
  ProviderCapability,
  ProviderPlugin,
  PvParseUrlInput,
  PvParseUrlOutput,
  PvResolveUrlInput,
  PvResolveUrlOutput,
  PvVideoResolveInput,
  PvVideoResolveOutput,
  BulkImportResult,
  GameSearchItem,
  GameSearchResult,
  SteamOwnedGameItem,
  ThirdPartyLibraryGameItem,
} from './types'

// ── Hook 调用 ─────────────────────────────────────────────
export { callAllHooks, callHook, notifyHook } from './hooks'

// ── 注册中心 ──────────────────────────────────────────────
export {
  getAllPlugins,
  getAllProviders,
  getAccountBindProviders,
  getBulkImportProviders,
  getCharacterProvider,
  getCharacterProviders,
  getEnabledCharacterProviders,
  getEnabledPlugins,
  getEnabledProviders,
  getEnabledFeatures,
  getManualSearchProviderOptions,
  getPlugin,
  getProvidersByCapability,
  initializePlugins,
  isPluginActive,
  registerCharacterProvider,
  registerPlugin,
  togglePlugin,
} from './registry'

// ── 内置插件工具函数 ──────────────────────────────────────
export { toBilibiliEmbedUrl, isBilibiliUrl } from './builtin/bilibili-plugin'
export {
  toYouTubeEmbedUrl,
  getYouTubeCover,
  isYouTubeUrl,
} from './builtin/youtube-plugin'

// ── 设置 ──────────────────────────────────────────────────
export {
  isPluginEnabled,
  PLUGIN_SETTINGS_EVENT,
  readPluginSettings,
  setPluginEnabled,
} from './settings'

// 注意：loader.ts 仅在服务端使用（含 fs/path），不在此导出
