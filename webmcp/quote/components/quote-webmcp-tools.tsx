'use client'

import { ensureWebMcpRuntime } from '@/webmcp/lib'
import { useExportQuoteTool } from '@/webmcp/quote/hooks/use-export-quote-tool'

// 在 useWebMCP 注册工具前安装 WebMCP 运行时（浏览器原生缺失时使用 polyfill）
ensureWebMcpRuntime()

/** 注册摘录相关的 WebMCP 工具，本身不渲染任何内容 */
export const QuoteWebMcpTools = () => {
  useExportQuoteTool()
  return null
}

export default QuoteWebMcpTools
