import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  imageFieldLabelMap,
  imageFieldList,
  isRemoteOrDataImage,
  readFileAsDataUrl,
  type ImageField,
} from '../lib/game-settings-media'
import { useGameImageSearch } from './use-game-image-search'
import { useGameMediaCrop } from './use-game-media-crop'
import { enqueueGameImageLocalizationById, updateGameSettingsById } from '@/api'
import { bgAtom } from '@/atom/global'
import {
  DEFAULT_LAST_GAME_BACKGROUND_IMAGE,
  readBackgroundSettings,
  updateLastGameBackground,
} from '@/lib/settings/background-settings'

import type { GameDetail } from '@/types'

export function useGameMediaSettings(game: GameDetail, gameTitle: string) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setGlobalBg = useSetAtom(bgAtom)
  const [draft, setDraft] = useState<Partial<Record<ImageField, string>>>({})
  const [localized, setLocalized] = useState<Partial<Record<ImageField, string>>>({})
  const fieldValueMap = {
    cover: game.cover || '',
    bg: game.bg || '',
    icon: game.icon || '',
    logo: game.logo || '',
    ...draft,
  }
  const [localizingMap, setLocalizingMap] = useState<Partial<Record<ImageField, boolean>>>({})
  const selectionRef = useRef<Partial<Record<ImageField, symbol>>>({})
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchTargetField, setSearchTargetField] = useState<ImageField>('cover')
  const imageSearch = useGameImageSearch(searchTargetField)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkDialogField, setLinkDialogField] = useState<ImageField>('cover')
  const [linkInputValue, setLinkInputValue] = useState('')
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerField, setViewerField] = useState<ImageField>('cover')
  const localization = useMutation({
    mutationFn: ({ field, sourceUrl }: { field: ImageField; sourceUrl: string }) =>
      enqueueGameImageLocalizationById(game.id, { imageType: field, sourceUrl }),
  })

  const applyImageSelection = (field: ImageField, value: string) => {
    const normalized = value.trim()
    const shouldLocalize = isRemoteOrDataImage(normalized)
    const selection = Symbol()
    selectionRef.current[field] = selection
    setDraft((prev) => ({ ...prev, [field]: value }))
    setLocalized((prev) => ({ ...prev, [field]: shouldLocalize ? '' : normalized }))
    setLocalizingMap((prev) => ({ ...prev, [field]: shouldLocalize }))
    if (!shouldLocalize) return

    void localization
      .mutateAsync({ field, sourceUrl: normalized })
      .then(({ data }) => {
        if (selectionRef.current[field] === selection && data.path) {
          setLocalized((prev) => ({ ...prev, [field]: data.path }))
        }
      })
      .catch((error) => {
        if (selectionRef.current[field] === selection) {
          toast.error(error?.response?.data?.error || error?.message || '后台下载图片失败')
        }
      })
      .finally(() => {
        if (selectionRef.current[field] === selection) {
          setLocalizingMap((prev) => ({ ...prev, [field]: false }))
        }
      })
  }
  const crop = useGameMediaCrop(applyImageSelection)

  const importFromFile = async (field: ImageField, file?: File) => {
    if (!file) {
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      applyImageSelection(field, dataUrl)
      toast.success(`已导入${imageFieldLabelMap[field]}`)
    } catch (error) {
      toast.error((error as Error).message || '从文件导入失败')
    }
  }

  const importFromClipboard = async (field: ImageField) => {
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read()
        for (const item of items) {
          const imageType = item.types.find((type) => type.startsWith('image/'))
          if (imageType) {
            const blob = await item.getType(imageType)
            const file = new File([blob], `${field}.png`, { type: blob.type })
            await importFromFile(field, file)
            return
          }
        }
      }

      if (navigator.clipboard?.readText) {
        const text = (await navigator.clipboard.readText()).trim()
        if (text) {
          applyImageSelection(field, text)
          toast.success(`已从剪贴板导入${imageFieldLabelMap[field]}链接`)
          return
        }
      }

      toast.error('剪贴板中未找到图片或链接')
    } catch (error) {
      toast.error((error as Error).message || '从剪贴板导入失败')
    }
  }

  const importFromLink = (field: ImageField) => {
    setLinkDialogField(field)
    setLinkInputValue(fieldValueMap[field])
    setLinkDialogOpen(true)
  }

  const applyLinkImport = () => {
    const nextValue = linkInputValue.trim()
    if (!nextValue) {
      toast.error('请输入图片链接')
      return
    }

    applyImageSelection(linkDialogField, nextValue)
    setLinkDialogOpen(false)
  }

  const openSearchImageDialog = (field: ImageField) => {
    setSearchTargetField(field)
    imageSearch.prepareSearch(gameTitle, field)
    setSearchDialogOpen(true)
  }

  const applySelectedSearchImage = () => {
    if (!imageSearch.selectedUrl) {
      toast.error('请先选择图片')
      return
    }

    applyImageSelection(searchTargetField, imageSearch.selectedUrl)
    setSearchDialogOpen(false)
    toast.success(`已设置${imageFieldLabelMap[searchTargetField]}`)
  }

  const openImageViewer = (field: ImageField) => {
    if (!fieldValueMap[field]) {
      return
    }
    setViewerField(field)
    setViewerOpen(true)
  }

  const hasPendingLocalization = Object.values(localizingMap).some(Boolean)
  const save = useMutation({
    mutationFn: async () => {
      const payload: Partial<Record<ImageField, string>> = {}
      for (const field of imageFieldList) {
        const value = draft[field]
        if (value === undefined) continue
        if (isRemoteOrDataImage(value) && !localized[field]) {
          throw new Error(`${imageFieldLabelMap[field]}尚未完成本地化，请重新选择图片后保存`)
        }
        payload[field] = (localized[field] ?? value).trim()
      }
      await updateGameSettingsById(game.id, payload)
      return payload
    },
    onSuccess: async (payload) => {
      queryClient.setQueryData<GameDetail>(
        ['game', String(game.id)],
        (previous) => previous && { ...previous, ...payload },
      )
      if (payload.bg !== undefined) {
        const settings = readBackgroundSettings()
        setGlobalBg(
          payload.bg ||
            (settings.customBackgroundEnabled && settings.customBackgroundImage.trim()) ||
            settings.lastGameBackgroundImage.trim() ||
            DEFAULT_LAST_GAME_BACKGROUND_IMAGE,
        )
        if (payload.bg) updateLastGameBackground(payload.bg)
      }
      setDraft((previous) => {
        const next = { ...previous }
        for (const field of imageFieldList) {
          if (previous[field] === draft[field]) delete next[field]
        }
        return next
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['game', String(game.id)] }),
        queryClient.invalidateQueries({ queryKey: ['game-cards'] }),
        queryClient.invalidateQueries({ queryKey: ['game-sidebar'] }),
      ])
      router.refresh()
      toast.success('媒体已保存')
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || error.message || '保存媒体失败')
    },
  })
  return {
    fieldValueMap,
    hasPendingLocalization,
    hasChanges: Object.keys(draft).length > 0,
    save,
    importFromFile,
    importFromClipboard,
    importFromLink,
    applyLinkImport,
    openSearchImageDialog,
    applySelectedSearchImage,
    openImageViewer,
    viewerOpen,
    setViewerOpen,
    viewerField,
    removeImage: (field: ImageField) => applyImageSelection(field, ''),
    searchDialogOpen,
    setSearchDialogOpen,
    searchTargetField,
    imageSearch,
    linkDialogOpen,
    setLinkDialogOpen,
    linkDialogField,
    linkInputValue,
    setLinkInputValue,
    crop,
  }
}
