'use client'

import { Grid2X2Icon, ListIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import type { ViewMode } from './types'

type PvPageHeaderProps = {
  viewMode: ViewMode
  onViewModeChange: (viewMode: ViewMode) => void
  onCreate: () => void
}

export function PvPageHeader({
  viewMode,
  onViewModeChange,
  onCreate,
}: PvPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">PV 管理</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <div className="inline-flex items-center rounded-lg p-1">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'grid' || value === 'list') {
                onViewModeChange(value)
              }
            }}
            variant={'outline'}
            className="gap-0"
          >
            <ToggleGroupItem
              value="grid"
              aria-label="网格模式"
              className="data-[state=on]:bg-background data-[state=on]:text-foreground text-muted-foreground rounded-md px-3 transition-all data-[state=on]:shadow-xs"
            >
              <Grid2X2Icon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="列表模式"
              className="data-[state=on]:bg-background data-[state=on]:text-foreground text-muted-foreground rounded-md px-3 transition-all data-[state=on]:shadow-xs"
            >
              <ListIcon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Button type="button" onClick={onCreate} variant="outline">
          <PlusIcon />
          新增 PV
        </Button>
      </div>
    </div>
  )
}
