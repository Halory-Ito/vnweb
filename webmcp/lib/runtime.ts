import { installWebMCP } from '@mcp-b/webmcp-polyfill'

let installed = false

/**
 * 确保 WebMCP 运行时可用：
 * 浏览器原生支持 `document.modelContext` 时保持不变，否则安装 polyfill 兜底。
 * 必须在注册工具（`useWebMCP`）之前调用，仅客户端生效。
 */
export function ensureWebMcpRuntime() {
  if (installed || typeof window === 'undefined') {
    return
  }

  installWebMCP()
  installed = true
}
