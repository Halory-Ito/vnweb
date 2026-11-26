'use client'

import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import type { PlatformImportSourceMeta } from '../../data/platform-import-sources'
import type { PlatformImportConflictStrategy, PlatformImportOptions } from '@/types/platform-import'

type PlatformImportOptionsProps = {
  options: PlatformImportOptions
  sourceMeta: PlatformImportSourceMeta
  disabled: boolean
  onChange: <K extends keyof PlatformImportOptions>(key: K, value: PlatformImportOptions[K]) => void
}

export function PlatformImportOptions({
  options,
  sourceMeta,
  disabled,
  onChange,
}: PlatformImportOptionsProps) {
  const conflictId = useId()
  const recordsId = useId()
  const imagesId = useId()
  const collectionsId = useId()
  const memoriesId = useId()
  const charactersId = useId()

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Label htmlFor={conflictId}>重复游戏默认处理</Label>
        <Select
          value={options.conflictStrategy}
          disabled={disabled}
          onValueChange={(value) =>
            onChange('conflictStrategy', value as PlatformImportConflictStrategy)
          }
        >
          <SelectTrigger id={conflictId} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="keep_existing">仅保留当前库</SelectItem>
            <SelectItem value="merge">合并双端数据</SelectItem>
            <SelectItem value="replace_with_imported">仅保留 {sourceMeta.label} 数据</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
        <div className="flex items-center gap-2">
          <Label htmlFor={recordsId}>游玩记录</Label>
          <Switch
            id={recordsId}
            checked={options.importPlayRecords}
            disabled={disabled}
            onCheckedChange={(checked) => onChange('importPlayRecords', checked)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={imagesId}>图片资源</Label>
          <Switch
            id={imagesId}
            checked={options.importImages}
            disabled={disabled}
            onCheckedChange={(checked) => onChange('importImages', checked)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={collectionsId}>收藏夹</Label>
          <Switch
            id={collectionsId}
            checked={options.importCollections}
            disabled={disabled}
            onCheckedChange={(checked) => onChange('importCollections', checked)}
          />
        </div>
        {sourceMeta.supportsMemories ? (
          <div className="flex items-center gap-2">
            <Label htmlFor={memoriesId}>游戏回忆</Label>
            <Switch
              id={memoriesId}
              checked={options.importMemories}
              disabled={disabled}
              onCheckedChange={(checked) => onChange('importMemories', checked)}
            />
          </div>
        ) : null}
        {sourceMeta.supportsCharacters ? (
          <div className="flex items-center gap-2">
            <Label htmlFor={charactersId}>角色资料</Label>
            <Switch
              id={charactersId}
              checked={options.importCharacters}
              disabled={disabled}
              onCheckedChange={(checked) => onChange('importCharacters', checked)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
