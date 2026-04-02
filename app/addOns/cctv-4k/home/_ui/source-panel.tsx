import { Signal } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { LiveSource } from '../../utils'

type SourcePanelProps = {
  sources: LiveSource[]
  activeSourceId: string
  onSelect: (sourceId: string) => void
}

function getSourceNameClass(source: LiveSource) {
  return source.needProxy ? 'text-blue-600' : 'text-foreground'
}

export function SourcePanel({
  sources,
  activeSourceId,
  onSelect,
}: SourcePanelProps) {
  return (
    <Card variant="outline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Signal className="size-4 text-red-500" />
          直播源
        </CardTitle>
        <CardDescription>精简视图</CardDescription>
      </CardHeader>
      <CardContent>
        {sources.length > 0 ? (
          <div className="max-h-[62vh] space-y-2 overflow-auto pr-1">
            {sources.map((source) => {
              const active = source.id === activeSourceId
              return (
                <div
                  key={source.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(source.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(source.id)
                    }
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-left transition ${
                    active
                      ? 'border-red-500 bg-red-500/5'
                      : 'hover:bg-muted/80 border-border/80'
                  }`}
                >
                  <div
                    className={`line-clamp-1 text-sm font-medium ${getSourceNameClass(source)}`}
                  >
                    {source.name}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            暂无直播源，请先点击“新增直播源”。
          </p>
        )}
      </CardContent>
    </Card>
  )
}
