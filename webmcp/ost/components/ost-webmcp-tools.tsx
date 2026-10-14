'use client'

import { ensureWebMcpRuntime } from '@/webmcp/lib'
import { useImportOstTool } from '@/webmcp/ost/hooks/use-import-ost-tool'
import { useSearchOstTool } from '@/webmcp/ost/hooks/use-search-ost-tool'

// 在 useWebMCP 注册工具前安装 WebMCP 运行时（浏览器原生缺失时使用 polyfill）
ensureWebMcpRuntime()

/** 注册 OST 相关的 WebMCP 工具，本身不渲染任何内容 */
export const OstWebMcpTools = () => {
  useSearchOstTool()
  useImportOstTool()
  return null
}

export default OstWebMcpTools
