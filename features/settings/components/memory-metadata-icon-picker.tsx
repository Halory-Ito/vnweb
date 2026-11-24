'use client'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { MemoryMetadataIcon } from '@/components/memory-metadata-icon'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  MEMORY_METADATA_ICON_OPTIONS,
  type MemoryMetadataIconKey,
} from '@/lib/settings/memory-metadata-settings'

type MemoryMetadataIconPickerProps = {
  value: MemoryMetadataIconKey
  disabled?: boolean
  onChange: (value: MemoryMetadataIconKey) => void
}

export function MemoryMetadataIconPicker({
  value,
  disabled,
  onChange,
}: MemoryMetadataIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const currentOption = useMemo(
    () =>
      MEMORY_METADATA_ICON_OPTIONS.find((option) => option.value === value) ??
      MEMORY_METADATA_ICON_OPTIONS[MEMORY_METADATA_ICON_OPTIONS.length - 1],
    [value],
  )

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return MEMORY_METADATA_ICON_OPTIONS
    }
    return MEMORY_METADATA_ICON_OPTIONS.filter(
      (option) =>
        option.label.toLowerCase().includes(keyword) ||
        option.value.toLowerCase().includes(keyword) ||
        option.keywords.some((term) => term.toLowerCase().includes(keyword)),
    )
  }, [query])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuery('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="选择字段图标"
          disabled={disabled}
          className="w-full justify-between px-3 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MemoryMetadataIcon icon={value} className="size-4 shrink-0" />
            <span className="truncate">{currentOption.label}</span>
          </span>
          <ChevronsUpDownIcon className="text-muted-foreground size-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="搜索图标（中/英文）..."
          />
          <CommandList className="max-h-64">
            {filteredOptions.length === 0 ? (
              <CommandEmpty>未找到匹配的图标</CommandEmpty>
            ) : (
              <CommandGroup className="[&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-2 [&_[cmdk-group-items]]:gap-1">
                {filteredOptions.map((option) => {
                  const selected = option.value === value
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        onChange(option.value)
                        handleOpenChange(false)
                      }}
                      className="justify-between"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <MemoryMetadataIcon icon={option.value} className="size-4 shrink-0" />
                        <span className="truncate">{option.label}</span>
                      </span>
                      {selected ? <CheckIcon className="text-primary size-3.5 shrink-0" /> : null}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
