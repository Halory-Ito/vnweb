'use client'

import { useAddGameTool } from '@/webmcp/game/hooks/use-add-game-tool'
import { useSyncCharactersTool } from '@/webmcp/game/hooks/use-sync-characters-tool'
import { useSyncPvTool } from '@/webmcp/game/hooks/use-sync-pv-tool'
import { ensureWebMcpRuntime } from '@/webmcp/lib'

// 在 useWebMCP 注册工具前安装 WebMCP 运行时（浏览器原生缺失时使用 polyfill）
ensureWebMcpRuntime()

/** 注册游戏相关的 WebMCP 工具，本身不渲染任何内容 */
export const GameWebMcpTools = () => {
  useAddGameTool()
  useSyncCharactersTool()
  useSyncPvTool()
  return null
}

export default GameWebMcpTools
