'use client'

import { useImportGuideTool } from '@/webmcp/guide/hooks/use-import-guide-tool'
import { ensureWebMcpRuntime } from '@/webmcp/lib'

// 在 useWebMCP 注册工具前安装 WebMCP 运行时（浏览器原生缺失时使用 polyfill）
ensureWebMcpRuntime()

/** 注册攻略相关的 WebMCP 工具，本身不渲染任何内容 */
export const GuideWebMcpTools = () => {
  useImportGuideTool()
  return null
}

export default GuideWebMcpTools
