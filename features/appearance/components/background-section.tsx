'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/request-utils'
import {
  BACKGROUND_TRANSITION_STYLE_OPTIONS,
  DEFAULT_BACKGROUND_SETTINGS,
  normalizeBackgroundSettings,
  notifyBackgroundSettingsChanged,
  readBackgroundSettings,
  writeBackgroundSettings,
  type BackgroundSettings,
} from '@/lib/settings/background-settings'

export function BackgroundSection() {
  const [settings, setSettings] = useState(DEFAULT_BACKGROUND_SETTINGS)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSettings(readBackgroundSettings())
  }, [])

  const update = (next: Partial<BackgroundSettings>) => {
    const normalized = normalizeBackgroundSettings({ ...settings, ...next })
    setSettings(normalized)
    writeBackgroundSettings(normalized)
    notifyBackgroundSettingsChanged()
  }

  const handlePickFile = () => fileInputRef.current?.click()

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)
    try {
      const response = await api.post('/settings/background/upload', formData)
      const payload = response.data as { data?: { path?: string } }
      const uploadedPath = payload.data?.path?.trim()
      if (!uploadedPath) throw new Error('未获取到上传后的背景路径')
      update({ customBackgroundImage: uploadedPath })
      toast.success('背景图片上传成功')
    } catch (error) {
      toast.error((error as Error).message || '上传背景图片失败')
    } finally {
      setIsUploading(false)
      input.value = ''
    }
  }

  return (
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
          checked={settings.customBackgroundEnabled}
          onCheckedChange={(checked) =>
            update({ customBackgroundEnabled: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between space-y-2">
        <span className="text-sm font-medium">自定义背景图片</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={handlePickFile}
        >
          {isUploading ? '上传中...' : '选择图片'}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">切换动画样式</p>
          <p className="text-muted-foreground text-xs">
            设置背景图片切换时的过渡效果。
          </p>
        </div>
        <div>
          <Select
            value={settings.transitionStyle}
            onValueChange={(value) =>
              update({
                transitionStyle: value as BackgroundSettings['transitionStyle'],
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="选择动画样式" />
            </SelectTrigger>
            <SelectContent>
              {BACKGROUND_TRANSITION_STYLE_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">过渡时长</span>
          <span className="text-muted-foreground text-sm">
            {settings.transitionDurationMs}ms
          </span>
        </div>
        <Slider
          min={0}
          max={3000}
          step={50}
          value={[settings.transitionDurationMs]}
          onValueChange={(value) =>
            update({ transitionDurationMs: value[0] ?? 0 })
          }
        />
      </div>
    </div>
  )
}
