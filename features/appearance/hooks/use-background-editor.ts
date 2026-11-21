'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/request-utils'
import {
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
  return response.data as {
    data: {
      custom: { active: boolean; path: { pc: string; mobile: string } }
      transitionStyle: string
      transitionDurationMs: number
    }
  }
}

const updateBackgroundConfigApi = async (data: {
  custom?: { active?: boolean; path?: { pc?: string; mobile?: string } }
  transitionStyle?: string
  transitionDurationMs?: number
}) => {
  const response = await api.post('/settings/background', data)
  return response.data
}

export function useBackgroundEditor() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(DEFAULT_BACKGROUND_SETTINGS)
  const [pendingUpload, setPendingUpload] = useState<{ file: File; device: DeviceType } | null>(
    null,
  )
  const upload = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.request<{ data: { path: string } }>({
        method: 'post',
        url: '/settings/background/upload',
        data,
      })
      return response.data.data.path
    },
  })
  const fileInputRefPc = useRef<HTMLInputElement>(null)
  const fileInputRefMobile = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      const needsSync =
        config.custom.active !== localSettings.customBackgroundEnabled ||
        config.custom.path.pc !== localSettings.customBackgroundImagePc ||
        config.custom.path.mobile !== localSettings.customBackgroundImageMobile ||
        config.transitionStyle !== localSettings.transitionStyle ||
        config.transitionDurationMs !== localSettings.transitionDurationMs

      if (needsSync) {
        const updatedSettings = {
          ...localSettings,
          customBackgroundEnabled: config.custom.active,
          customBackgroundImagePc: config.custom.path.pc,
          customBackgroundImageMobile: config.custom.path.mobile,
          transitionStyle: config.transitionStyle as BackgroundSettings['transitionStyle'],
          transitionDurationMs: config.transitionDurationMs,
        }
        setSettings(updatedSettings)
        writeBackgroundSettings(updatedSettings)
        notifyBackgroundSettingsChanged()
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

  const syncToConfig = (normalized: BackgroundSettings) => {
    updateConfigMutation.mutate({
      custom: {
        active: normalized.customBackgroundEnabled,
        path: {
          pc: normalized.customBackgroundImagePc,
          mobile: normalized.customBackgroundImageMobile,
        },
      },
      transitionStyle: normalized.transitionStyle,
      transitionDurationMs: normalized.transitionDurationMs,
    })
  }

  // 立即更新并同步到 config.json（用于非滑块类设置）
  const update = (next: Partial<BackgroundSettings>) => {
    clearTimeout(debounceTimerRef.current ?? undefined)
    const normalized = normalizeBackgroundSettings({ ...readBackgroundSettings(), ...next })
    setSettings(normalized)
    writeBackgroundSettings(normalized)
    notifyBackgroundSettingsChanged()
    syncToConfig(normalized)
  }

  // 带防抖的更新（用于滑块类设置，本地立即生效，API 防抖）
  const updateWithDebounce = (next: Partial<BackgroundSettings>) => {
    const normalized = normalizeBackgroundSettings({ ...settings, ...next })
    setSettings(normalized)
    writeBackgroundSettings(normalized)
    notifyBackgroundSettingsChanged()

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      syncToConfig(normalized)
    }, 500)
  }

  const handlePickFile = (device: DeviceType) => {
    if (device === 'mobile') {
      fileInputRefMobile.current?.click()
    } else {
      fileInputRefPc.current?.click()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, device: DeviceType) => {
    const input = event.currentTarget
    const file = event.target.files?.[0]
    if (file) setPendingUpload({ file, device })
    input.value = ''
  }

  const confirmUpload = async (name: string) => {
    if (!pendingUpload || upload.isPending) return
    const { file, device } = pendingUpload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('device', device)
    formData.append('name', name)

    try {
      const uploadedPath = await upload.mutateAsync(formData)
      if (!uploadedPath) throw new Error('未获取到上传后的背景路径')

      if (device === 'mobile') {
        update({ customBackgroundImageMobile: uploadedPath })
      } else {
        update({ customBackgroundImagePc: uploadedPath })
      }

      setPendingUpload(null)
      toast.success(`${device === 'mobile' ? '移动端' : 'PC端'}背景图片上传成功`)
    } catch (error) {
      toast.error((error as Error).message || '上传背景图片失败')
    }
  }

  return {
    settings,
    isUploading: upload.isPending,
    pendingUpload,
    cancelUpload: () => setPendingUpload(null),
    confirmUpload,
    fileInputRefPc,
    fileInputRefMobile,
    handlePickFile,
    handleFileChange,
    update,
    updateWithDebounce,
  }
}
