'use client'

import { useAtom } from 'jotai'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { gameLibraryGridDisplayAtom, isGridDisplay } from '@/lib/settings/game-library-grid-display'

export default function GridDisplaySetting() {
  const [display, setDisplay] = useAtom(gameLibraryGridDisplayAtom)

  return (
    <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
      <Label htmlFor="game-library-grid-display">网格展示方式</Label>
      <Select
        value={display}
        onValueChange={(value) => {
          if (isGridDisplay(value)) setDisplay(value)
        }}
      >
        <SelectTrigger id="game-library-grid-display" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="folders">文件夹</SelectItem>
            <SelectItem value="sections">按标题分组</SelectItem>
            <SelectItem value="ungrouped">不分组</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
