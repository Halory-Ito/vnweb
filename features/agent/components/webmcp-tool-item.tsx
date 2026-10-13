'use client'

import { ChevronDownIcon, WrenchIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const ANNOTATION_LABELS: Array<{ key: keyof WebMCP.ToolAnnotations; label: string }> = [
  { key: 'readOnlyHint', label: '只读' },
  { key: 'consequentialHint', label: '有副作用' },
  { key: 'untrustedContentHint', label: '不可信内容' },
  { key: 'debugging', label: '调试' },
]

/** 单个 WebMCP 工具的详情卡片 */
export function WebMcpToolItem({ tool }: { tool: WebMCP.RegisteredTool }) {
  const annotations = ANNOTATION_LABELS.filter(({ key }) => Boolean(tool.annotations?.[key]))
  const schema = tool.inputSchema ? JSON.stringify(tool.inputSchema, null, 2) : ''

  return (
    <Collapsible className="bg-card rounded-lg border">
      <CollapsibleTrigger className="group flex w-full items-center gap-2.5 p-3 text-left">
        <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md border">
          <WrenchIcon className="text-muted-foreground size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{tool.title || tool.name}</span>
          <span className="text-muted-foreground block truncate font-mono text-xs">
            {tool.name}
          </span>
        </span>
        <ChevronDownIcon className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2.5 border-t px-3 py-2.5">
        <p className="text-muted-foreground text-xs leading-relaxed">{tool.description}</p>

        {annotations.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {annotations.map(({ key, label }) => (
              <Badge key={key} variant="outline">
                {label}
              </Badge>
            ))}
          </div>
        ) : null}

        {schema ? (
          <div>
            <div className="text-muted-foreground mb-1 text-[11px]">入参 Schema</div>
            <pre className="bg-muted/50 max-h-48 overflow-auto rounded-md p-2 font-mono text-[11px]">
              {schema}
            </pre>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}
