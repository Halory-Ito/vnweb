'use client'

import { useState } from 'react'

import { useFontSettings } from '../hooks/use-font-settings'
import { FontDialog } from './font-dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { DEFAULT_FONT_SETTINGS, FONT_SIZE_RANGE } from '@/lib/settings/font-settings'

export function FontSection() {
  const {
    settings,
    fontName,
    selectFont,
    fontSize,
    fontWeight,
    hasTypographyChanges,
    editTypography,
    applyTypography,
  } = useFontSettings()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div>
        <p className="text-base font-semibold">字体</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">当前字体</p>
        <div className="ml-auto flex max-w-full min-w-0 items-center justify-end gap-2">
          <span className="text-muted-foreground min-w-0 truncate text-sm" title={fontName}>
            {fontName}
          </span>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            aria-label="重新选择字体"
            onClick={() => setDialogOpen(true)}
          >
            重新选择
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">字体大小</span>
          <span className="text-muted-foreground text-sm">{fontSize} px</span>
        </div>
        <Slider
          {...FONT_SIZE_RANGE}
          step={1}
          thumbLabel="字体大小"
          value={[fontSize]}
          onValueChange={(value) =>
            editTypography({ fontSize: value[0] ?? DEFAULT_FONT_SETTINGS.fontSize })
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">字体粗细</span>
          <span className="text-muted-foreground text-sm">{fontWeight}</span>
        </div>
        <Slider
          min={100}
          max={900}
          step={100}
          thumbLabel="字体粗细"
          value={[fontWeight]}
          onValueChange={(value) =>
            editTypography({ fontWeight: value[0] ?? DEFAULT_FONT_SETTINGS.fontWeight })
          }
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={!hasTypographyChanges}
          onClick={applyTypography}
        >
          应用
        </Button>
      </div>

      <FontDialog
        open={dialogOpen}
        currentFontPath={settings.fontPath}
        currentFontWeight={settings.fontWeight}
        onOpenChange={setDialogOpen}
        onApply={(fontPath) => {
          selectFont(fontPath)
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
