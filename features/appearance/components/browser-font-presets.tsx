'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BROWSER_FONT_OPTIONS } from '@/lib/settings/font-settings'

type BrowserFontPresetsProps = {
  selectedPath: string
  onSelect: (fontPath: string) => void
}

export function BrowserFontPresets({ selectedPath, onSelect }: BrowserFontPresetsProps) {
  const selectedValue = BROWSER_FONT_OPTIONS.some((option) => option.fontPath === selectedPath)
    ? selectedPath
    : ''

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="浏览器字体类别"
      value={selectedValue}
      onValueChange={(value) => {
        const option = BROWSER_FONT_OPTIONS.find((item) => item.fontPath === value)
        if (option) onSelect(option.fontPath)
      }}
    >
      {BROWSER_FONT_OPTIONS.map((option) => (
        <ToggleGroupItem key={option.fontPath} value={option.fontPath} title={option.family}>
          {option.shortLabel}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
