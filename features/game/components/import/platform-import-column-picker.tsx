'use client'

import { Columns3 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { PlatformImportOptionalColumnMeta } from '../../data/platform-import-sources'
import type { PlatformImportOptionalColumn } from '@/types/platform-import'

type PlatformImportColumnPickerProps = {
  columns: PlatformImportOptionalColumnMeta[]
  visibleColumns: Set<PlatformImportOptionalColumn>
  disabled?: boolean
  onToggle: (column: PlatformImportOptionalColumn, visible?: boolean) => void
  onReset: () => void
}

export function PlatformImportColumnPicker({
  columns,
  visibleColumns,
  disabled = false,
  onToggle,
  onReset,
}: PlatformImportColumnPickerProps) {
  const activeCount = columns.filter((col) => visibleColumns.has(col.id)).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} className="shrink-0">
          <Columns3 className="size-4" />
          {activeCount > 0 ? `显示字段（${activeCount}）` : '显示字段'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            checked={visibleColumns.has(col.id)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onToggle(col.id, Boolean(checked))}
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
        {activeCount > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReset}>恢复默认</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
