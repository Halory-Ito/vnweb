'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/request-utils'
import {
  BACKGROUND_TRANSITION_STYLE_OPTIONS,
  DEFAULT_BACKGROUND_SETTINGS,
  normalizeBackgroundSettings,
  notifyBackgroundSettingsChanged,
  readBackgroundSettings,
  writeBackgroundSettings,
  type BackgroundSettings,
  type DeviceType,
} from '@/lib/settings/background-settings'

// API 函数
const getBackgroundConfigApi = async () => {
  const response = await api.get('/settings/background')
  return response.data as { data: { active: boolean; path: { pc: string; mobile: string } } }
}

const updateBackgroundConfigApi = async (data: { active?: boolean; path?: { pc?: string; mobile?: string } }) => {
  const response = await api.post('/settings/background', data)
  return response.data
}

export function BackgroundSection() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(DEFAULT_BACKGROUND_SETTINGS)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDevice, setUploadDevice] = useState<DeviceType>('pc')
  const fileInputRefPc = useRef<HTMLInputElement>(null)
  const fileInputRefMobile = useRef<HTMLInputElement>(null)

  // 从 config.json 读取配置
  const { data: configData } = useQuery({
    queryKey: ['background-config'],
    queryFn: getBackgroundConfigApi,
  })

  // 更新 config.json 的 mutation
  const updateConfigMutation = useMutation({
    mutationFn: updateBackgroundConfigApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background-config'] })
    },
  })

  useEffect(() => {
    setSettings(readBackgroundSettings())
  }, [])

  // 当 config 数据加载时，同步到本地存储
  useEffect(() => {
    if (configData?.data) {
      const config = configData.data
      const localSettings = readBackgroundSettings()

      // 如果 config.json 中有配置，同步到本地存储
      if (config.active !== localSettings.customBackgroundEnabled ||
          config.path.pc !== localSettings.customBackgroundImagePc ||
          config.path.mobile !== localSettings.customBackgroundImageMobile) {
        const updatedSettings = {
          ...localSettings,
          customBackgroundEnabled: config.active,
          customBackgroundImagePc: config.path.pc,
          customBackgroundImageMobile: config.path.mobile,
        }
        setSettings(updatedSettings)
        writeBackgroundSettings(updatedSettings)
        notifyBackgroundSettingsChanged()
      }
    }
  }, [configData])

  const update = (next: Partial<BackgroundSettings>) => {
    const normalized = normalizeBackgroundSettings({ ...settings, ...next })
    setSettings(normalized)
    writeBackgroundSettings(normalized)
    notifyBackgroundSettingsChanged()

    // 同步到 config.json
    updateConfigMutation.mutate({
      active: normalized.customBackgroundEnabled,
      path: {
        pc: normalized.customBackgroundImagePc,
        mobile: normalized.customBackgroundImageMobile,
      },
    })
  }

  const handlePickFile = (device: DeviceType) => {
    setUploadDevice(device)
    if (device === 'mobile') {
      fileInputRefMobile.current?.click()
    } else {
      fileInputRefPc.current?.click()
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    device: DeviceType,
  ) => {
    const input = event.currentTarget
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('device', device)

    setIsUploading(true)
    try {
      const response = await api.post('/settings/background/upload', formData)
      const payload = response.data as { data?: { path?: string } }
      const uploadedPath = payload.data?.path?.trim()
      if (!uploadedPath) throw new Error('未获取到上传后的背景路径')

      if (device === 'mobile') {
        update({ customBackgroundImageMobile: uploadedPath })
      } else {
        update({ customBackgroundImagePc: uploadedPath })
      }

      toast.success(`${device === 'mobile' ? '移动端' : 'PC端'}背景图片上传成功`)
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

      <div className="space-y-3">
        <span className="text-sm font-medium">自定义背景图片</span>
        <p className="text-muted-foreground text-xs">
          移动端和PC端可以分别设置不同的背景图片。
        </p>

        <Tabs defaultValue="pc" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="pc" className="flex-1">PC端</TabsTrigger>
            <TabsTrigger value="mobile" className="flex-1">移动端</TabsTrigger>
          </TabsList>

          <TabsContent value="pc" className="mt-4 space-y-3">
            <input
              ref={fileInputRefPc}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleFileChange(event, 'pc')}
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">PC端背景</p>
                {settings.customBackgroundImagePc && (
                  <p className="text-muted-foreground max-w-48 truncate text-xs">
                    {settings.customBackgroundImagePc}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => handlePickFile('pc')}
              >
                {isUploading && uploadDevice === 'pc' ? '上传中...' : '选择图片'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="mt-4 space-y-3">
            <input
              ref={fileInputRefMobile}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleFileChange(event, 'mobile')}
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">移动端背景</p>
                {settings.customBackgroundImageMobile && (
                  <p className="text-muted-foreground max-w-48 truncate text-xs">
                    {settings.customBackgroundImageMobile}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => handlePickFile('mobile')}
              >
                {isUploading && uploadDevice === 'mobile' ? '上传中...' : '选择图片'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
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
