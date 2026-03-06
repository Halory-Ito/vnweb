'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DEFAULT_BACKGROUND_SETTINGS,
  normalizeBackgroundSettings,
  notifyBackgroundSettingsChanged,
  readBackgroundSettings,
  writeBackgroundSettings,
} from '@/lib/background-settings'
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
  const [backgroundSettings, setBackgroundSettings] = useState(
    DEFAULT_BACKGROUND_SETTINGS,
  )
  const [isUploadingBackground, setIsUploadingBackground] = useState(false)
  const backgroundFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedSettings = readGlassSettings()
    const savedBackgroundSettings = readBackgroundSettings()
    setGlassSettings(savedSettings)
    setBackgroundSettings(savedBackgroundSettings)
    applyGlassSettingsToDocument(savedSettings)
  }, [])

  const updateGlassSettings = (next: Partial<typeof glassSettings>) => {
    const normalized = normalizeGlassSettings({ ...glassSettings, ...next })
    setGlassSettings(normalized)
    writeGlassSettings(normalized)
    applyGlassSettingsToDocument(normalized)
    notifyGlassSettingsChanged()
  }

  const updateBackgroundSettings = (
    next: Partial<typeof backgroundSettings>,
  ) => {
    const normalized = normalizeBackgroundSettings({
      ...backgroundSettings,
      ...next,
    })
    setBackgroundSettings(normalized)
    writeBackgroundSettings(normalized)
    notifyBackgroundSettingsChanged()
  }

  const handlePickBackgroundFile = () => {
    backgroundFileInputRef.current?.click()
  }

  const handleBackgroundFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setIsUploadingBackground(true)
    try {
      const response = await fetch('/api/settings/background/upload', {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        data?: {
          path?: string
        }
      }

      if (!response.ok) {
        throw new Error(payload.error || '上传背景图片失败')
      }

      const uploadedPath = payload.data?.path?.trim()
      if (!uploadedPath) {
        throw new Error('未获取到上传后的背景路径')
      }

      updateBackgroundSettings({ customBackgroundImage: uploadedPath })
      toast.success('背景图片已复制到 public 目录')
    } catch (error) {
      toast.error((error as Error).message || '上传背景图片失败')
    } finally {
      setIsUploadingBackground(false)
      event.currentTarget.value = ''
    }
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
        <div className="space-y-6">
          <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
            <div>
              <p className="text-base font-semibold">背景</p>
              <p className="text-muted-foreground mt-1 text-sm">
                关闭时自动使用最近一次游戏背景；开启后优先使用你选择的自定义背景。
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">启用自定义背景</p>
                <p className="text-muted-foreground text-xs">
                  默认关闭。进入游戏详情页时会显示该游戏自己的背景。
                </p>
              </div>
              <Switch
                checked={backgroundSettings.customBackgroundEnabled}
                onCheckedChange={(checked) =>
                  updateBackgroundSettings({
                    customBackgroundEnabled: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between space-y-2">
              <span className="text-sm font-medium">自定义背景图片</span>
              <input
                ref={backgroundFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleBackgroundFileChange(event)
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingBackground}
                onClick={handlePickBackgroundFile}
              >
                {isUploadingBackground ? '上传中...' : '选择图片'}
              </Button>
            </div>
          </div>

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
