'use client'

import { Trash2Icon } from 'lucide-react'

import { MemoryMetadataIconPicker } from './memory-metadata-icon-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import type { MemoryMetadataFieldConfig } from '@/lib/settings/memory-metadata-settings'

type MemoryMetadataFieldRowProps = {
  field: MemoryMetadataFieldConfig
  disabled: boolean
  onChange: (patch: Partial<MemoryMetadataFieldConfig>) => void
  onRemove: () => void
}

export function MemoryMetadataFieldRow({
  field,
  disabled,
  onChange,
  onRemove,
}: MemoryMetadataFieldRowProps) {
  return (
    <div className="border-border/60 grid grid-cols-1 gap-2.5 border-b pb-3.5 last:border-b-0 last:pb-0 md:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto] md:items-center">
      <MemoryMetadataIconPicker
        value={field.icon}
        disabled={disabled}
        onChange={(icon) => onChange({ icon })}
      />

      <Input
        value={field.label}
        disabled={disabled}
        onChange={(event) => onChange({ label: event.target.value })}
        placeholder="显示名称"
        aria-label="显示名称"
      />

      <Input
        value={field.key}
        disabled={disabled || Boolean(field.builtin)}
        onChange={(event) => onChange({ key: event.target.value })}
        placeholder="frontmatter 键名"
        aria-label="Frontmatter 键名"
      />

      <Input
        value={field.placeholder ?? ''}
        disabled={disabled}
        onChange={(event) => onChange({ placeholder: event.target.value })}
        placeholder="输入提示文案"
        aria-label="输入提示文案"
      />

      <div className="flex items-center justify-end gap-2">
        <Switch
          checked={field.enabled}
          disabled={disabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
          aria-label={`启用 ${field.label || field.key || '字段'}`}
        />

        {field.builtin ? (
          <div className="size-6 shrink-0" aria-hidden="true" />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            aria-label="删除字段"
            onClick={onRemove}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
