'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BROWSER_FONT_OPTIONS } from '@/lib/settings/font-settings'

type BrowserFontPresetsProps = {
  selectedPath: string
  onSelect: (fontPath: string, label: string) => void
}

export function BrowserFontPresets({ selectedPath, onSelect }: BrowserFontPresetsProps) {
  const selectedValue = BROWSER_FONT_OPTIONS.some((option) => option.fontPath === selectedPath)
    ? selectedPath
    : ''

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">跟随浏览器字体设置</p>
        <p className="text-muted-foreground truncate text-xs">
          由浏览器决定实际字形（serif / sans-serif / monospace）
        </p>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={selectedValue}
        onValueChange={(value) => {
          const option = BROWSER_FONT_OPTIONS.find((item) => item.fontPath === value)
          if (option) onSelect(option.fontPath, option.label)
        }}
      >
        {BROWSER_FONT_OPTIONS.map((option) => (
          <ToggleGroupItem key={option.fontPath} value={option.fontPath} title={option.family}>
            {option.shortLabel}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
