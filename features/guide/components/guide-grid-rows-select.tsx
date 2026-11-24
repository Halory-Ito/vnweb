'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GUIDE_GRID_ROW_OPTIONS } from '@/features/guide/hooks/use-guide-grid-layout'

export function GuideGridRowsSelect({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="guide-grid-rows" className="text-muted-foreground text-sm">
        行数
      </label>
      <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
        <SelectTrigger id="guide-grid-rows" className="h-8 w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GUIDE_GRID_ROW_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option} 行
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
