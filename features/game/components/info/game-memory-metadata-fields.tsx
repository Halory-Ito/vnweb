'use client'

import { FileTextIcon, PlusIcon, TagIcon, Trash2Icon } from 'lucide-react'
import { useId } from 'react'

import { GameMemoryManageFieldsButton } from './game-memory-manage-fields-button'
import { GameMemoryOstPicker } from './game-memory-ost-picker'
import { MemoryMetadataIcon } from '@/components/memory-metadata-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMemoryMetadataSettings } from '@/hooks/use-memory-metadata-settings'

import type { MemoryFrontmatterEntry } from '../../lib/memory-frontmatter'

type GameMemoryMetadataFieldsProps = {
  gameId: number
  summary: string
  tagsInput: string
  ostSongIds: number[]
  metadataValues: Record<string, string>
  extraEntries: MemoryFrontmatterEntry[]
  onSummaryChange: (value: string) => void
  onTagsInputChange: (value: string) => void
  onOstSongIdsChange: (ids: number[]) => void
  onMetadataValueChange: (key: string, value: string) => void
  onExtraEntriesChange: (entries: MemoryFrontmatterEntry[]) => void
}

export function GameMemoryMetadataFields({
  gameId,
  summary,
  tagsInput,
  ostSongIds,
  metadataValues,
  extraEntries,
  onSummaryChange,
  onTagsInputChange,
  onOstSongIdsChange,
  onMetadataValueChange,
  onExtraEntriesChange,
}: GameMemoryMetadataFieldsProps) {
  const { enabledFields } = useMemoryMetadataSettings()
  const summaryId = useId()
  const tagsId = useId()
  const fieldPrefix = useId()

  const handleAddEntry = () => {
    onExtraEntriesChange([...extraEntries, { key: '', value: '' }])
  }

  const handleUpdateEntry = (index: number, field: 'key' | 'value', val: string) => {
    onExtraEntriesChange(
      extraEntries.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: val } : entry,
      ),
    )
  }

  const handleRemoveEntry = (index: number) => {
    onExtraEntriesChange(extraEntries.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <Label htmlFor={summaryId}>
          <FileTextIcon className="text-muted-foreground size-3.5" />
          描述信息
        </Label>
        <Textarea
          id={summaryId}
          value={summary}
          onChange={(event) => onSummaryChange(event.target.value)}
          className="field-sizing-fixed max-h-32 min-h-20 resize-none text-sm"
          placeholder="简要描述这段回忆（将写入 frontmatter）..."
        />
      </div>

      <div className="space-y-2.5">
        <Label htmlFor={tagsId}>
          <TagIcon className="text-muted-foreground size-3.5" />
          标签
        </Label>
        <Input
          id={tagsId}
          value={tagsInput}
          onChange={(event) => onTagsInputChange(event.target.value)}
          placeholder="逗号分隔，如：名场面, 剧透"
        />
      </div>

      <GameMemoryOstPicker
        gameId={gameId}
        selectedSongIds={ostSongIds}
        onChange={onOstSongIdsChange}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>元数据</Label>
          <GameMemoryManageFieldsButton />
        </div>

        {enabledFields.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {enabledFields.map((field) => {
              const inputId = `${fieldPrefix}-${field.key}`
              return (
                <div key={field.key} className="space-y-2.5">
                  <Label htmlFor={inputId}>
                    <MemoryMetadataIcon
                      icon={field.icon}
                      className="text-muted-foreground size-3.5"
                    />
                    {field.label}
                  </Label>
                  <Input
                    id={inputId}
                    value={metadataValues[field.key] ?? ''}
                    onChange={(event) => onMetadataValueChange(field.key, event.target.value)}
                    placeholder={field.placeholder || `输入${field.label}...`}
                  />
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <Label>自定义元数据</Label>
          <Button type="button" variant="outline" size="xs" onClick={handleAddEntry}>
            <PlusIcon className="size-3.5" />
            添加字段
          </Button>
        </div>

        {extraEntries.length > 0 ? (
          <div className="space-y-2">
            {extraEntries.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={entry.key}
                  onChange={(event) => handleUpdateEntry(index, 'key', event.target.value)}
                  placeholder="字段名，如：路线"
                  className="w-36 shrink-0"
                />
                <Input
                  value={entry.value}
                  onChange={(event) => handleUpdateEntry(index, 'value', event.target.value)}
                  placeholder="字段值"
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="删除字段"
                  onClick={() => handleRemoveEntry(index)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
