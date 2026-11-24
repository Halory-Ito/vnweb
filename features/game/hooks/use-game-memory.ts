'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  type MemoryFrontmatterEntry,
  parseTagsInput,
  serializeMemoryMarkdown,
} from '../lib/memory-frontmatter'
import { createGameMemoryById, getGameMemoriesById } from '@/api'
import { useMemoryMetadataSettings } from '@/hooks/use-memory-metadata-settings'
import { buildMemoryMetadataEntries } from '@/lib/settings/memory-metadata-settings'

export async function compressMemoryImageForUpload(file: File) {
  // Balance quality and upload speed for screenshots.
  const bitmap = await createImageBitmap(file)
  const maxWidth = 1920
  const maxHeight = 1080

  const ratio = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
  const targetWidth = Math.max(1, Math.round(bitmap.width * ratio))
  const targetHeight = Math.max(1, Math.round(bitmap.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    return file
  }

  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.82)
  })

  if (!blob || blob.size >= file.size) {
    return file
  }

  const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'memory'

  return new File([blob], `${safeName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}

export function useGameMemory(gameId: number) {
  const { fields } = useMemoryMetadataSettings()
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [ostSongIds, setOstSongIds] = useState<number[]>([])
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>({})
  const [extraEntries, setExtraEntries] = useState<MemoryFrontmatterEntry[]>([])
  const [body, setBody] = useState('')

  const imagePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ''),
    [imageFile],
  )

  useEffect(() => {
    if (!imagePreviewUrl) {
      return
    }
    return () => {
      URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['game-memory', gameId, keyword],
    queryFn: () => getGameMemoriesById(gameId, keyword),
    enabled: Boolean(gameId),
  })

  const items = useMemo(() => data?.items ?? [], [data])

  const handleSearch = () => {
    setKeyword(keywordInput.trim())
  }

  const clearImage = () => {
    setImageFile(null)
  }

  const setMetadataValue = (key: string, value: string) => {
    setMetadataValues((prev) => ({ ...prev, [key]: value }))
  }

  const resetDialog = () => {
    setImageFile(null)
    setTitle('')
    setSummary('')
    setTagsInput('')
    setOstSongIds([])
    setMetadataValues({})
    setExtraEntries([])
    setBody('')
  }

  const openCreateDialog = () => {
    resetDialog()
    setDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetDialog()
    }
  }

  const handleCreate = async () => {
    if (!imageFile) {
      toast.error('请先上传截图')
      return
    }

    setIsSaving(true)
    try {
      const optimizedImage = await compressMemoryImageForUpload(imageFile)
      const mergedExtraEntries = buildMemoryMetadataEntries(metadataValues, fields, extraEntries)
      const description = serializeMemoryMarkdown({
        summary,
        tags: parseTagsInput(tagsInput),
        ostSongIds,
        extraEntries: mergedExtraEntries,
        body,
      })

      await createGameMemoryById(gameId, {
        image: optimizedImage,
        title: title.trim(),
        description,
      })
      toast.success('回忆已保存')

      setDialogOpen(false)
      resetDialog()
      await refetch()
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '保存回忆失败')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    items,
    isLoading,
    isRefetching,
    keywordInput,
    setKeywordInput,
    dialogOpen,
    isSaving,
    imagePreviewUrl,
    setImageFile,
    clearImage,
    title,
    setTitle,
    summary,
    setSummary,
    tagsInput,
    setTagsInput,
    ostSongIds,
    setOstSongIds,
    metadataValues,
    setMetadataValue,
    extraEntries,
    setExtraEntries,
    body,
    setBody,
    openCreateDialog,
    handleDialogOpenChange,
    handleSearch,
    handleCreate,
  }
}
