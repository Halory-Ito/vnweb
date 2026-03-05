'use client'

import { useEffect, useState } from 'react'

import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  applyGlassSettingsToDocument,
  DEFAULT_GLASS_SETTINGS,
  normalizeGlassSettings,
  notifyGlassSettingsChanged,
  readGlassSettings,
  writeGlassSettings,
} from '@/lib/glass-settings'

export default function Settings() {
  const [glassSettings, setGlassSettings] = useState(DEFAULT_GLASS_SETTINGS)

  useEffect(() => {
    const savedSettings = readGlassSettings()
    setGlassSettings(savedSettings)
    applyGlassSettingsToDocument(savedSettings)
  }, [])

  const updateGlassSettings = (next: Partial<typeof glassSettings>) => {
    const normalized = normalizeGlassSettings({ ...glassSettings, ...next })
    setGlassSettings(normalized)
    writeGlassSettings(normalized)
    applyGlassSettingsToDocument(normalized)
    notifyGlassSettingsChanged()
  }

  return (
    <Tabs
      defaultValue="general"
      className="max-h-[calc(100vh-144px)] w-full overflow-y-scroll"
    >
      <TabsList className="dark:bg-transparent">
        <TabsTrigger value="general">通用</TabsTrigger>
        <TabsTrigger value="appearance">外观</TabsTrigger>
        <TabsTrigger value="advanced">高级</TabsTrigger>
        <TabsTrigger value="metadata">元数据</TabsTrigger>
        <TabsTrigger value="theme">主题</TabsTrigger>
        <TabsTrigger value="sync">云同步</TabsTrigger>
        <TabsTrigger value="scraper">刮削器</TabsTrigger>
        <TabsTrigger value="database">数据库</TabsTrigger>
        <TabsTrigger value="network">网络</TabsTrigger>
        <TabsTrigger value="about">关于</TabsTrigger>
      </TabsList>
      <TabsContent className="h-full w-full" value="general">
        通用
      </TabsContent>
      <TabsContent value="appearance">
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
                {glassSettings.blur}px
              </span>
            </div>
            <Slider
              min={0}
              max={150}
              step={1}
              value={[glassSettings.blur]}
              onValueChange={(value) =>
                updateGlassSettings({ blur: value[0] ?? 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">透明度</span>
              <span className="text-muted-foreground text-sm">
                {glassSettings.opacity}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[glassSettings.opacity]}
              onValueChange={(value) =>
                updateGlassSettings({ opacity: value[0] ?? 0 })
              }
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="advanced">高级</TabsContent>
      <TabsContent value="metadata">元数据</TabsContent>
      <TabsContent value="theme">主题</TabsContent>
      <TabsContent value="sync">云同步</TabsContent>
      <TabsContent value="scraper">刮削器</TabsContent>
      <TabsContent value="database">数据库</TabsContent>
      <TabsContent value="network">网络</TabsContent>
      <TabsContent value="about">关于</TabsContent>
    </Tabs>
  )
}
