'use client'

import { ChevronDownIcon, CircleCheckIcon, CircleXIcon, Loader2Icon } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import type { AgentToolRun } from '@/features/agent/lib/chat-types'

const STATUS_META = {
  running: { label: '调用中', icon: Loader2Icon, className: 'text-muted-foreground animate-spin' },
  success: { label: '已完成', icon: CircleCheckIcon, className: 'text-emerald-500' },
  error: { label: '失败', icon: CircleXIcon, className: 'text-destructive' },
} as const

const prettyJson = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

/** 单次 WebMCP 工具调用的展示卡片 */
export function AgentToolRunCard({ run }: { run: AgentToolRun }) {
  const status = STATUS_META[run.status]
  const StatusIcon = status.icon

  return (
    <Collapsible className="bg-muted/40 rounded-lg border">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2 text-left text-xs">
        <StatusIcon className={`size-3.5 shrink-0 ${status.className}`} />
        <span className="min-w-0 flex-1 truncate font-mono font-medium">{run.name}</span>
        <span className="text-muted-foreground shrink-0">{status.label}</span>
        <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t px-3 py-2">
        <div>
          <div className="text-muted-foreground mb-1 text-[11px]">参数</div>
          <pre className="bg-background/60 max-h-40 overflow-auto rounded-md p-2 font-mono text-[11px]">
            {prettyJson(run.arguments)}
          </pre>
        </div>
        {run.result ? (
          <div>
            <div className="text-muted-foreground mb-1 text-[11px]">结果</div>
            <pre className="bg-background/60 max-h-48 overflow-auto rounded-md p-2 font-mono text-[11px] whitespace-pre-wrap">
              {prettyJson(run.result)}
            </pre>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}
