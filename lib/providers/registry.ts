// 向后兼容：从统一插件注册中心重新导出
export {
  getAccountBindProviders,
  getAllProviders,
  getBulkImportProviders,
  getEnabledProviders,
  getManualSearchProviderOptions,
  getPlugin as getProviderById,
  getProvidersByCapability,
  isPluginActive as isProviderPluginEnabled,
  togglePlugin as toggleProvider,
} from '@/lib/plugins/registry'
