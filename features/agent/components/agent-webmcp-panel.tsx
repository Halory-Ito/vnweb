'use client'

import { PlugZapIcon, RefreshCwIcon } from 'lucide-react'

import { WebMcpToolItem } from './webmcp-tool-item'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'

import type { WebMcpToolsStatus } from '@/features/agent/hooks/use-webmcp-tools'

type AgentWebMcpPanelProps = {
  tools: WebMCP.RegisteredTool[]
  status: WebMcpToolsStatus
  onRefresh: () => void
}

/** WebMCP 面板：发现当前页面已注册的工具 */
export function AgentWebMcpPanel({ tools, status, onRefresh }: AgentWebMcpPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">已注册工具</span>
          <Badge variant="outline">{tools.length}</Badge>
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          aria-label="刷新工具列表"
          disabled={status === 'loading'}
          onClick={onRefresh}
        >
          {status === 'loading' ? <Spinner /> : <RefreshCwIcon />}
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {status === 'error' ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PlugZapIcon />
              </EmptyMedia>
              <EmptyTitle>加载失败</EmptyTitle>
              <EmptyDescription>无法读取 WebMCP 工具，请点击刷新重试</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : tools.length === 0 ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PlugZapIcon />
              </EmptyMedia>
              <EmptyTitle>暂无已注册工具</EmptyTitle>
              <EmptyDescription>当页面通过 WebMCP 注册工具后会自动显示在这里</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          tools.map((tool) => <WebMcpToolItem key={tool.name} tool={tool} />)
        )}
      </div>
    </div>
  )
}
