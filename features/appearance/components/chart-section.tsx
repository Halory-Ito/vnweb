'use client'

import { useEffect, useRef, useState } from 'react'

import { Slider } from '@/components/ui/slider'
import {
  DEFAULT_CHART_SETTINGS,
  notifyChartSettingsChanged,
  readChartSettings,
  writeChartSettings,
} from '@/lib/settings/chart-settings'

export function ChartSection() {
  const [settings, setSettings] = useState(DEFAULT_CHART_SETTINGS)
  const [draftColor, setDraftColor] = useState(DEFAULT_CHART_SETTINGS.color)
  const [draftOpacity, setDraftOpacity] = useState(DEFAULT_CHART_SETTINGS.opacity)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) {
      return
    }
    hasLoadedRef.current = true

    readChartSettings().then((saved) => {
      setSettings(saved)
      setDraftColor(saved.color)
      setDraftOpacity(saved.opacity)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleColorChange = (color: string) => {
    setDraftColor(color)
  }

  const handleColorConfirm = async () => {
    if (draftColor !== settings.color) {
      const merged = { ...settings, color: draftColor }
      setSettings(merged)
      await writeChartSettings(merged)
      notifyChartSettingsChanged()
    }
  }

  const handleOpacityChange = (opacity: number) => {
    setDraftOpacity(opacity)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      const merged = { ...settings, opacity }
      setSettings(merged)
      await writeChartSettings(merged)
      notifyChartSettingsChanged()
    }, 500)
  }

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div>
        <p className="text-base font-semibold">图表</p>
        <p className="text-muted-foreground mt-1 text-sm">
          自定义图表的默认颜色和透明度，设置将应用到所有图表组件。
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">图表颜色</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{draftColor}</span>
            <input
              type="color"
              value={draftColor}
              onChange={(e) => handleColorChange(e.target.value)}
              onBlur={handleColorConfirm}
              className="h-8 w-8 cursor-pointer rounded border border-input"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">图表透明度</span>
          <span className="text-muted-foreground text-sm">
            {draftOpacity}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[draftOpacity]}
          onValueChange={(value) => handleOpacityChange(value[0] ?? 100)}
        />
      </div>
    </div>
  )
}
