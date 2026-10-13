'use client'

import { useCallback, useEffect, useState } from 'react'

import { listWebMcpTools } from '@/webmcp/lib'

export type WebMcpToolsStatus = 'loading' | 'ready' | 'error'

/** 发现当前文档已注册的 WebMCP 工具，并在工具变化时自动刷新 */
export function useWebMcpTools() {
  const [tools, setTools] = useState<WebMCP.RegisteredTool[]>([])
  const [status, setStatus] = useState<WebMcpToolsStatus>('loading')

  const refresh = useCallback(async () => {
    try {
      const list = await listWebMcpTools()
      setTools(list)
      setStatus('ready')
    } catch (error) {
      console.error('List WebMCP tools failed:', error)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void refresh()

    const context = document.modelContext
    const handleToolChange = () => {
      void refresh()
    }

    context?.addEventListener('toolchange', handleToolChange)
    return () => context?.removeEventListener('toolchange', handleToolChange)
  }, [refresh])

  return { tools, status, refresh }
}
