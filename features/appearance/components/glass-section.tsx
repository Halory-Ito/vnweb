'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { Slider } from '@/components/ui/slider'
import { api } from '@/lib/request-utils'
import {
  DEFAULT_GLASS_SETTINGS,
  normalizeGlassSettings,
  notifyGlassSettingsChanged,
  readGlassSettings,
  writeGlassSettings,
  type GlassSettings,
} from '@/lib/settings/glass-settings'

// API 函数
const getGlassConfigApi = async () => {
  const response = await api.get('/settings/appearance/glass')
  return response.data as { data: GlassSettings }
}

const updateGlassConfigApi = async (data: Partial<GlassSettings>) => {
  const response = await api.post('/settings/appearance/glass', data)
  return response.data
}

export function GlassSection() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(DEFAULT_GLASS_SETTINGS)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 从 config.json 读取配置
  const { data: configData } = useQuery({
    queryKey: ['glass-config'],
    queryFn: getGlassConfigApi,
  })

  // 更新 config.json 的 mutation
  const updateConfigMutation = useMutation({
    mutationFn: updateGlassConfigApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glass-config'] })
    },
  })

  useEffect(() => {
    const saved = readGlassSettings()
    setSettings(saved)
  }, [])

  // 当 config 数据加载时，同步到本地存储
  useEffect(() => {
    if (configData?.data) {
      const config = configData.data
      const localSettings = readGlassSettings()

      // 如果 config.json 中有配置，同步到本地存储
      if (config.blur !== localSettings.blur || config.opacity !== localSettings.opacity) {
        const updatedSettings = normalizeGlassSettings(config)
        setSettings(updatedSettings)
        writeGlassSettings(updatedSettings)
        notifyGlassSettingsChanged()
      }
    }
  }, [configData])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const update = (next: Partial<GlassSettings>) => {
    const normalized = normalizeGlassSettings({ ...settings, ...next })
    setSettings(normalized)

    // 本地存储和 CSS 变量立即生效
    writeGlassSettings(normalized)
    notifyGlassSettingsChanged()

    // API 同步到 config.json 使用防抖
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updateConfigMutation.mutate({
        blur: normalized.blur,
        opacity: normalized.opacity,
      })
    }, 500)
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
