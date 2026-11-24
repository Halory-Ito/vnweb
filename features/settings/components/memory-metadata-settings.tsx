'use client'

import { PlusIcon, RotateCcwIcon, SaveIcon } from 'lucide-react'

import { useMemoryMetadataEditor } from '../hooks/use-memory-metadata-editor'
import { MemoryMetadataFieldRow } from './memory-metadata-field-row'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function MemoryMetadataSettings() {
  const editor = useMemoryMetadataEditor()

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold">回忆元数据</p>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={editor.addField}>
            <PlusIcon className="size-4" />
            新增字段
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={editor.isSaving}
            onClick={() => void editor.resetToDefault()}
          >
            <RotateCcwIcon className="size-4" />
            恢复默认
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={editor.isSaving}
            onClick={() => void editor.save()}
          >
            <SaveIcon className="size-4" />
            {editor.isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {editor.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          {editor.fields.map((field, index) => (
            <MemoryMetadataFieldRow
              key={field.builtin ? field.key : `custom-${index}`}
              field={field}
              disabled={editor.isSaving}
              onChange={(patch) => editor.updateField(index, patch)}
              onRemove={() => editor.removeField(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
