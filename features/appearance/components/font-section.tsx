'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { getLocalFontDisplayName } from '../font-api'
import { FontDialog } from './font-dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  applyFontSettingsToDocument,
  BROWSER_FONT_OPTIONS,
  DEFAULT_FONT_SETTINGS,
  getFontConfigApi,
  normalizeFontSettings,
  notifyFontSettingsChanged,
  readFontSettings,
  updateFontConfigApi,
  writeFontSettings,
  type FontSettings,
} from '@/lib/settings/font-settings'

const getFontNameFromPath = (fontPath: string) => {
  const browserFontLabel = BROWSER_FONT_OPTIONS.find(
    (option) => option.fontPath === fontPath,
  )?.shortLabel
  if (browserFontLabel) {
    return browserFontLabel
  }

  const normalized = fontPath.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  const withoutExt = fileName.replace(/\.[^.]+$/, '') || fileName
  return withoutExt.replace(/_\d{10,14}$/, '')
}

export function FontSection() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(DEFAULT_FONT_SETTINGS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filename = settings.fontPath.startsWith('/assets/fonts/')
    ? settings.fontPath.slice('/assets/fonts/'.length)
    : ''
  const { data: localizedName } = useQuery({
    queryKey: ['local-font-display-name', filename],
    queryFn: () => getLocalFontDisplayName(filename),
    enabled: Boolean(filename),
    staleTime: Infinity,
  })
  const fontName = localizedName ?? getFontNameFromPath(settings.fontPath)

  const { data: configData } = useQuery({
    queryKey: ['font-config'],
    queryFn: getFontConfigApi,
  })

  const updateConfigMutation = useMutation({
    mutationFn: updateFontConfigApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['font-config'] })
    },
  })

  useEffect(() => {
    const saved = readFontSettings()
    setSettings(saved)
    void applyFontSettingsToDocument(saved)
  }, [])

  useEffect(() => {
    if (!configData?.persisted || !configData.data) {
      return
    }
    const config = normalizeFontSettings(configData.data)
    const localSettings = readFontSettings()
    if (
      config.fontPath !== localSettings.fontPath ||
      config.fontSize !== localSettings.fontSize ||
      config.fontWeight !== localSettings.fontWeight
    ) {
      setSettings(config)
      writeFontSettings(config)
      void applyFontSettingsToDocument(config)
      notifyFontSettingsChanged()
    }
  }, [configData])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const update = (next: Partial<FontSettings>) => {
    const normalized = normalizeFontSettings({ ...settings, ...next })
    setSettings(normalized)
    writeFontSettings(normalized)
    void applyFontSettingsToDocument(normalized)
    notifyFontSettingsChanged()

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updateConfigMutation.mutate(normalized)
    }, 300)
  }

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">字体粗细</span>
          <span className="text-muted-foreground text-sm">{settings.fontWeight}</span>
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
