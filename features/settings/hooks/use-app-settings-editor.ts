'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { getDesktopRuntimeInfo, restartDesktopServer } from '@/lib/desktop-window'
import { applyAppBrandingToDocument } from '@/lib/settings/app-branding'
import {
  ALLOWED_APP_ICON_EXTENSIONS,
  APP_NAME_MAX_LENGTH,
  DEFAULT_APP_NAME,
  DEFAULT_APP_PORT,
  DEFAULT_APP_SETTINGS,
  getAppSettingsApi,
  hasControlCharacters,
  isValidAppPort,
  MAX_APP_PORT,
  MIN_APP_PORT,
  normalizeAppName,
  normalizeAppSettings,
  notifyAppSettingsChanged,
  resetAppIconApi,
  updateAppSettingsApi,
  uploadAppIconApi,
  writeAppSettings,
  type AppSettingsPatch,
  type AppSettingsResponse,
} from '@/lib/settings/app-settings'

const MAX_ICON_FILE_BYTES = 5 * 1024 * 1024
const DESKTOP_ICON_SIZE = 256

function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { error?: string } }; message?: string }
  return err.response?.data?.error || err.message || fallback
}

function isSupportedIconFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  const lower = file.name.toLowerCase()
  return ALLOWED_APP_ICON_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

async function renderDesktopPngBlob(file: File): Promise<Blob | null> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return null

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Image decode failed'))
      element.src = objectUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = DESKTOP_ICON_SIZE
    canvas.height = DESKTOP_ICON_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const srcW = img.naturalWidth > 0 ? img.naturalWidth : DESKTOP_ICON_SIZE
    const srcH = img.naturalHeight > 0 ? img.naturalHeight : DESKTOP_ICON_SIZE
    const scale = Math.min(DESKTOP_ICON_SIZE / srcW, DESKTOP_ICON_SIZE / srcH)
    const drawW = srcW * scale
    const drawH = srcH * scale
    const offsetX = (DESKTOP_ICON_SIZE - drawW) / 2
    const offsetY = (DESKTOP_ICON_SIZE - drawH) / 2

    ctx.clearRect(0, 0, DESKTOP_ICON_SIZE, DESKTOP_ICON_SIZE)
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH)

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function useAppSettingsEditor() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [portDraft, setPortDraft] = useState<string | null>(null)
  const [canRestartServer, setCanRestartServer] = useState(false)

  const query = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettingsApi,
  })

  useEffect(() => {
    let active = true
    void getDesktopRuntimeInfo().then((info) => {
      if (active && info?.isSidecar) {
        setCanRestartServer(true)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const savedSettings = query.data?.data ?? DEFAULT_APP_SETTINGS
  const runtimePort = query.data?.runtimePort ?? null
  const nameInput = nameDraft ?? savedSettings.name
  const portInput = portDraft ?? String(savedSettings.port)

  const applyUpdatedResponse = (response: AppSettingsResponse) => {
    const normalized = normalizeAppSettings(response.data)
    queryClient.setQueryData<AppSettingsResponse>(['app-settings'], {
      data: normalized,
      runtimePort: response.runtimePort,
    })
    writeAppSettings(normalized)
    notifyAppSettingsChanged()
    applyAppBrandingToDocument(normalized)
    if (typeof window !== 'undefined') {
      void import('@/lib/desktop-window').then(({ syncDesktopAppBranding }) =>
        syncDesktopAppBranding(document.title),
      )
    }
  }

  const saveNameMutation = useMutation({
    mutationFn: (patch: AppSettingsPatch) => updateAppSettingsApi(patch),
    onSuccess: (response) => {
      setNameDraft(null)
      applyUpdatedResponse(response)
      toast.success('软件名称已保存')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '保存软件名称失败'))
    },
  })

  const savePortMutation = useMutation({
    mutationFn: (patch: AppSettingsPatch) => updateAppSettingsApi(patch),
    onSuccess: (response) => {
      setPortDraft(null)
      applyUpdatedResponse(response)
      toast.success('端口号已保存')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '保存端口号失败'))
    },
  })

  const uploadIconMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const isPng = file.type === 'image/png' && file.name.toLowerCase().endsWith('.png')
      if (!isPng) {
        const desktopBlob = await renderDesktopPngBlob(file)
        if (desktopBlob) {
          formData.append(
            'desktopIcon',
            new File([desktopBlob], 'desktop-icon.png', { type: 'image/png' }),
          )
        }
      }
      return uploadAppIconApi(formData)
    },
    onSuccess: (response) => {
      applyUpdatedResponse(response)
      toast.success('软件图标已更新')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '上传软件图标失败'))
    },
  })

  const resetIconMutation = useMutation({
    mutationFn: () => resetAppIconApi(),
    onSuccess: (response) => {
      applyUpdatedResponse(response)
      toast.success('已恢复默认软件图标')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '恢复默认软件图标失败'))
    },
  })

  const restartMutation = useMutation({
    mutationFn: () => {
      const returnPath =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/settings/general'
      return restartDesktopServer(returnPath)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '重启本地服务失败'))
    },
  })

  const isBusy =
    saveNameMutation.isPending ||
    savePortMutation.isPending ||
    uploadIconMutation.isPending ||
    resetIconMutation.isPending ||
    restartMutation.isPending

  const handleSaveName = () => {
    if (hasControlCharacters(nameInput)) {
      toast.error('软件名称不能包含控制字符')
      return
    }
    const trimmed = nameInput.trim()
    if (trimmed.length > APP_NAME_MAX_LENGTH) {
      toast.error(`软件名称最多 ${APP_NAME_MAX_LENGTH} 个字符`)
      return
    }
    saveNameMutation.mutate({ name: normalizeAppName(trimmed) })
  }

  const handleResetName = () => {
    setNameDraft(null)
    if (savedSettings.name === DEFAULT_APP_NAME) return
    saveNameMutation.mutate({ name: DEFAULT_APP_NAME })
  }

  const handlePickIcon = () => {
    fileInputRef.current?.click()
  }

  const handleIconFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!isSupportedIconFile(file)) {
      toast.error('请选择有效的图片文件')
      return
    }
    if (file.size <= 0 || file.size > MAX_ICON_FILE_BYTES) {
      toast.error('图标文件大小需在 1B 到 5MB 之间')
      return
    }
    uploadIconMutation.mutate(file)
  }

  const handleSavePort = () => {
    const trimmed = portInput.trim()
    const parsed = trimmed ? Number(trimmed) : Number.NaN
    if (!isValidAppPort(parsed)) {
      toast.error(`端口号必须是 ${MIN_APP_PORT} 至 ${MAX_APP_PORT} 之间的整数`)
      return
    }
    savePortMutation.mutate({ port: parsed })
  }

  const handleResetPort = () => {
    setPortDraft(null)
    if (savedSettings.port === DEFAULT_APP_PORT) return
    savePortMutation.mutate({ port: DEFAULT_APP_PORT })
  }

  const hasNameChanges =
    !hasControlCharacters(nameInput) &&
    nameInput.trim().length <= APP_NAME_MAX_LENGTH &&
    normalizeAppName(nameInput) !== savedSettings.name

  const hasCustomName =
    savedSettings.name !== DEFAULT_APP_NAME ||
    (nameDraft !== null && normalizeAppName(nameDraft) !== DEFAULT_APP_NAME)

  const parsedPortDraft = portInput.trim() ? Number(portInput.trim()) : Number.NaN
  const hasPortChanges = portDraft !== null && parsedPortDraft !== savedSettings.port
  const hasCustomPort =
    savedSettings.port !== DEFAULT_APP_PORT ||
    (portDraft !== null && portInput.trim() !== String(DEFAULT_APP_PORT))

  return {
    query,
    savedSettings,
    runtimePort,
    canRestartServer,
    fileInputRef,
    nameInput,
    setNameDraft,
    portInput,
    setPortDraft,
    hasNameChanges,
    hasCustomName,
    hasPortChanges,
    hasCustomPort,
    isBusy,
    isSavingName: saveNameMutation.isPending,
    isSavingPort: savePortMutation.isPending,
    isUploadingIcon: uploadIconMutation.isPending,
    isResettingIcon: resetIconMutation.isPending,
    isRestarting: restartMutation.isPending,
    handleSaveName,
    handleResetName,
    handlePickIcon,
    handleIconFileChange,
    handleResetIcon: () => resetIconMutation.mutate(),
    handleSavePort,
    handleResetPort,
    handleRestartServer: () => restartMutation.mutate(),
  }
}
