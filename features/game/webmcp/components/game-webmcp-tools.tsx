'use client'

import { useAddGameTool } from '@/features/game/webmcp/hooks/use-add-game-tool'
import { ensureWebMcpRuntime } from '@/lib/webmcp'

// 在 useWebMCP 注册工具前安装 WebMCP 运行时（浏览器原生缺失时使用 polyfill）
ensureWebMcpRuntime()

/** 注册游戏相关的 WebMCP 工具，本身不渲染任何内容 */
export const GameWebMcpTools = () => {
  useAddGameTool()
  return null
}

export default GameWebMcpTools
