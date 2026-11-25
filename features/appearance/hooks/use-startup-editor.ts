'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  DEFAULT_STARTUP_SETTINGS,
  getStartupConfigApi,
  normalizeStartupSettings,
  notifyStartupSettingsChanged,
  readStartupSettings,
  renameStartupMediaApi,
  type StartupImageConfig,
  type StartupMediaKind,
  type StartupSettings,
  type StartupSettingsPatch,
  type StartupVideoConfig,
  updateStartupConfigApi,
  uploadStartupMediaApi,
  writeStartupSettings,
} from '@/lib/settings/startup-settings'
import {
  extractStartupFileName,
  isValidStartupMediaName,
  probeStartupMediaDimensionsFromFile,
  probeStartupMediaDimensionsFromUrl,
  resolveStartupMediaMeta,
  splitFileNameParts,
} from '@/lib/settings/startup-upload-name'

export type PendingStartupUpload = {
  file: File
  mediaType: StartupMediaKind
  extension: string
}

function mergeStartupSettings(base: StartupSettings, patch: StartupSettingsPatch): StartupSettings {
  return normalizeStartupSettings({
    enabled: patch.enabled ?? base.enabled,
    activeType: patch.activeType ?? base.activeType,
    image: patch.image ? { ...base.image, ...patch.image } : base.image,
    video: patch.video ? { ...base.video, ...patch.video } : base.video,
  })
}

export function useStartupEditor() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(DEFAULT_STARTUP_SETTINGS)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<PendingStartupUpload | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const probedPathsRef = useRef<Set<string>>(new Set())
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const { data: configData } = useQuery({
    queryKey: ['startup-config'],
    queryFn: getStartupConfigApi,
  })

  const updateConfigMutation = useMutation({
    mutationFn: updateStartupConfigApi,
    onSuccess: (response) => {
      if (response?.data) {
        const normalized = normalizeStartupSettings(response.data)
        writeStartupSettings(normalized)
        notifyStartupSettingsChanged()
      }
      void queryClient.invalidateQueries({ queryKey: ['startup-config'] })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: uploadStartupMediaApi,
  })

  const renameMutation = useMutation({
    mutationFn: ({ mediaType, name }: { mediaType: StartupMediaKind; name: string }) =>
      renameStartupMediaApi(mediaType, name),
    onSuccess: (response) => {
      if (response?.data) {
        const normalized = normalizeStartupSettings(response.data)
        settingsRef.current = normalized
        setSettings(normalized)
        writeStartupSettings(normalized)
        notifyStartupSettingsChanged()
      }
      setRenameDialogOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['startup-config'] })
      toast.success('文件名已更新')
    },
    onError: (error) => {
      toast.error((error as Error).message || '重命名启动动画失败')
    },
  })

  useEffect(() => {
    const initial = readStartupSettings()
    settingsRef.current = initial
    setSettings(initial)
  }, [])

  useEffect(() => {
    if (!configData?.data) return
    const remote = normalizeStartupSettings(configData.data)
    settingsRef.current = remote
    setSettings(remote)
    writeStartupSettings(remote)
    notifyStartupSettingsChanged()
  }, [configData])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const update = useCallback(
    (patch: StartupSettingsPatch) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      const normalized = mergeStartupSettings(settingsRef.current, patch)
      settingsRef.current = normalized
      setSettings(normalized)
      writeStartupSettings(normalized)
      notifyStartupSettingsChanged()
      updateConfigMutation.mutate(normalized)
    },
    [updateConfigMutation],
  )

  const updateActiveSlot = useCallback(
    (patch: Partial<StartupImageConfig> | Partial<StartupVideoConfig>) => {
      const kind = settingsRef.current.activeType
      if (kind === 'video') {
        update({ video: patch as Partial<StartupVideoConfig> })
      } else {
        update({ image: patch as Partial<StartupImageConfig> })
      }
    },
    [update],
  )

  const updateActiveSlotWithDebounce = (
    patch: Partial<StartupImageConfig> | Partial<StartupVideoConfig>,
  ) => {
    const kind = settingsRef.current.activeType
    const nextPatch: StartupSettingsPatch =
      kind === 'video'
        ? { video: patch as Partial<StartupVideoConfig> }
        : { image: patch as Partial<StartupImageConfig> }
    const normalized = mergeStartupSettings(settingsRef.current, nextPatch)
    settingsRef.current = normalized
    setSettings(normalized)
    writeStartupSettings(normalized)
    notifyStartupSettingsChanged()

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updateConfigMutation.mutate(normalized)
    }, 500)
  }

  const activeKind = settings.activeType
  const activeSlot = settings[activeKind]

  useEffect(() => {
    if (!configData?.data) return
    if (!activeSlot.mediaPath) return
    if (activeSlot.mediaWidth !== null && activeSlot.mediaHeight !== null) return

    const cleanPath = activeSlot.mediaPath.split(/[?#]/)[0] ?? activeSlot.mediaPath
    if (probedPathsRef.current.has(cleanPath)) return
    probedPathsRef.current.add(cleanPath)

    let cancelled = false
    void probeStartupMediaDimensionsFromUrl(activeSlot.mediaPath, activeKind).then((dims) => {
      if (cancelled || !dims) return
      const latestSlot = settingsRef.current[activeKind]
      const latestCleanPath = latestSlot.mediaPath.split(/[?#]/)[0] ?? latestSlot.mediaPath
      if (latestCleanPath !== cleanPath) return
      update({ [activeKind]: { mediaWidth: dims.width, mediaHeight: dims.height } })
    })

    return () => {
      cancelled = true
    }
  }, [
    activeKind,
    activeSlot.mediaHeight,
    activeSlot.mediaPath,
    activeSlot.mediaWidth,
    configData?.data,
    update,
  ])

  const setActiveType = (kind: StartupMediaKind) => {
    if (kind === settingsRef.current.activeType) return
    setPendingUpload(null)
    setRenameDialogOpen(false)
    update({ activeType: kind })
  }

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = event.target.files?.[0]
    input.value = ''
    if (!file) return

    const expectedType = settingsRef.current.activeType
    const meta = resolveStartupMediaMeta(file.name, file.type)
    if (!meta || meta.mediaType !== expectedType) {
      toast.error(
        expectedType === 'image'
          ? '请选择常见图片文件（PNG/JPG/WebP/GIF/AVIF/SVG）'
          : '请选择常见视频文件（MP4/WebM/OGG/MOV/M4V）',
      )
      return
    }

    setPendingUpload({ file, mediaType: meta.mediaType, extension: meta.ext })
  }

  const confirmUpload = async (name: string) => {
    if (!pendingUpload || uploadMutation.isPending) return
    const { file, mediaType } = pendingUpload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    formData.append('mediaType', mediaType)

    try {
      const [dims, response] = await Promise.all([
        probeStartupMediaDimensionsFromFile(file, mediaType),
        uploadMutation.mutateAsync(formData),
      ])
      const { path: uploadedPath, mediaType: uploadedMediaType } = response.data
      if (!uploadedPath) throw new Error('未获取到上传后的启动素材路径')

      const cleanPath = uploadedPath.split(/[?#]/)[0] ?? uploadedPath
      probedPathsRef.current.add(cleanPath)
      update({
        enabled: true,
        activeType: uploadedMediaType,
        [uploadedMediaType]: {
          mediaPath: uploadedPath,
          mediaWidth: dims?.width ?? null,
          mediaHeight: dims?.height ?? null,
        },
      })
      setPendingUpload(null)
      toast.success('启动动画素材上传成功')
    } catch (error) {
      toast.error((error as Error).message || '上传启动动画失败')
    }
  }

  const confirmRename = (name: string) => {
    if (renameMutation.isPending) return
    renameMutation.mutate({ mediaType: settingsRef.current.activeType, name })
  }

  const clearMedia = () => {
    setPreviewOpen(false)
    setRenameDialogOpen(false)
    updateActiveSlot({
      mediaPath: '',
      mediaWidth: null,
      mediaHeight: null,
    })
  }

  const fileName = extractStartupFileName(activeSlot.mediaPath)
  const durationSeconds = (settings.image.durationMs / 1000).toFixed(2).replace(/\.?0+$/, '')

  let nameDialog: {
    key: string
    props: {
      mode: 'upload' | 'rename'
      initialName: string
      extension: string
      isSubmitting: boolean
      onCancel: () => void
      onConfirm: (name: string) => void
    }
  } | null = null

  if (pendingUpload) {
    const baseName = splitFileNameParts(pendingUpload.file.name).baseName.trim()
    nameDialog = {
      key: `upload-${activeKind}-${pendingUpload.file.name}`,
      props: {
        mode: 'upload',
        initialName: isValidStartupMediaName(baseName) ? baseName : '',
        extension: pendingUpload.extension,
        isSubmitting: uploadMutation.isPending,
        onCancel: () => setPendingUpload(null),
        onConfirm: (name) => void confirmUpload(name),
      },
    }
  } else if (renameDialogOpen && fileName) {
    const fileParts = splitFileNameParts(fileName)
    nameDialog = {
      key: `rename-${activeKind}-${activeSlot.mediaPath}`,
      props: {
        mode: 'rename',
        initialName: fileParts.baseName,
        extension: fileParts.extension,
        isSubmitting: renameMutation.isPending,
        onCancel: () => setRenameDialogOpen(false),
        onConfirm: confirmRename,
      },
    }
  }

  return {
    settings,
    activeType: activeKind,
    activeSlot,
    fileName,
    durationSeconds,
    nameDialog,
    isUploading: uploadMutation.isPending,
    isRenaming: renameMutation.isPending,
    fileInputRef,
    previewOpen,
    setPreviewOpen,
    setActiveType,
    handlePickFile,
    handleFileChange,
    openRenameDialog: () => setRenameDialogOpen(true),
    clearMedia,
    update,
    updateActiveSlot,
    updateActiveSlotWithDebounce,
  }
}
