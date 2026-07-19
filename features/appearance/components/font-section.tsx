'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  applyFontSettingsToDocument,
  DEFAULT_FONT_SETTINGS,
  normalizeFontSettings,
  notifyFontSettingsChanged,
  readFontSettings,
  writeFontSettings,
  type FontSettings,
} from '@/lib/settings/font-settings'

import { FontDialog } from './font-dialog'

const getFontNameFromPath = (fontPath: string) => {
  const normalized = fontPath.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  const withoutExt = fileName.replace(/\.[^.]+$/, '') || fileName
  return withoutExt.replace(/_\d{10,14}$/, '')
}

export function FontSection() {
  const [settings, setSettings] = useState(DEFAULT_FONT_SETTINGS)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const saved = readFontSettings()
    setSettings(saved)
    void applyFontSettingsToDocument(saved)
  }, [])

  const update = (next: Partial<FontSettings>) => {
    const normalized = normalizeFontSettings({ ...settings, ...next })
    setSettings(normalized)
    writeFontSettings(normalized)
    void applyFontSettingsToDocument(normalized)
    notifyFontSettingsChanged()
  }

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div>
        <p className="text-base font-semibold">字体</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">当前字体</p>
          <p
            className="text-muted-foreground truncate text-xs"
            title={settings.fontPath}
          >
            {getFontNameFromPath(settings.fontPath)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogOpen(true)}
        >
          选择字体
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">字体粗细</span>
          <span className="text-muted-foreground text-sm">
            {settings.fontWeight}
          </span>
        </div>
        <Slider
          min={100}
          max={900}
          step={100}
          value={[settings.fontWeight]}
          onValueChange={(value) => update({ fontWeight: value[0] ?? 400 })}
        />
      </div>

      <FontDialog
        open={dialogOpen}
        currentFontPath={settings.fontPath}
        currentFontWeight={settings.fontWeight}
        onOpenChange={setDialogOpen}
        onApply={(fontPath) => {
          update({ fontPath })
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
