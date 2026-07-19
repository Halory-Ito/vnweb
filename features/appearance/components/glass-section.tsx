'use client'

import { useEffect, useState } from 'react'

import { Slider } from '@/components/ui/slider'
import {
  DEFAULT_GLASS_SETTINGS,
  normalizeGlassSettings,
  notifyGlassSettingsChanged,
  readGlassSettings,
  writeGlassSettings,
  type GlassSettings,
} from '@/lib/settings/glass-settings'

export function GlassSection() {
  const [settings, setSettings] = useState(DEFAULT_GLASS_SETTINGS)

  useEffect(() => {
    const saved = readGlassSettings()
    setSettings(saved)
  }, [])

  const update = (next: Partial<GlassSettings>) => {
    const normalized = normalizeGlassSettings({ ...settings, ...next })
    setSettings(normalized)
    writeGlassSettings(normalized)
    notifyGlassSettingsChanged()
  }

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div>
        <p className="text-base font-semibold">毛玻璃</p>
        <p className="text-muted-foreground mt-1 text-sm">
          调整全局毛玻璃模糊与透明度，设置将实时应用到所有页面。
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">模糊度</span>
          <span className="text-muted-foreground text-sm">
            {settings.blur}px
          </span>
        </div>
        <Slider
          min={0}
          max={150}
          step={1}
          value={[settings.blur]}
          onValueChange={(value) => update({ blur: value[0] ?? 0 })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">透明度</span>
          <span className="text-muted-foreground text-sm">
            {settings.opacity}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[settings.opacity]}
          onValueChange={(value) => update({ opacity: value[0] ?? 0 })}
        />
      </div>
    </div>
  )
}
