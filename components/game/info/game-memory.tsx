'use client'

import { evaluate } from '@mdx-js/mdx'
import { MDXProvider } from '@mdx-js/react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createGameMemoryById,
  deleteGameMemoryById,
  getGameMemoriesById,
  type GameMemoryItem,
  updateGameMemoryById,
} from '@/lib/game-utils'

type GameMemoryProps = {
  gameId: number
}

export default function GameMemory({ gameId }: GameMemoryProps) {
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeItem, setActiveItem] = useState<GameMemoryItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['game-memory', gameId, keyword],
    queryFn: () => getGameMemoriesById(gameId, keyword),
    enabled: Boolean(gameId),
  })

  const items = useMemo(() => data?.items ?? [], [data])

  const handleSearch = () => {
    setKeyword(keywordInput.trim())
  }

  const resetDialog = () => {
    setImageFile(null)
    setImagePreviewUrl('')
    setTitle('')
    setDescription('')
  }

  useEffect(() => {
    if (!imageFile) {
      return
    }
    const preview = URL.createObjectURL(imageFile)
    setImagePreviewUrl(preview)
    return () => {
      URL.revokeObjectURL(preview)
    }
  }, [imageFile])

  const compressImageForUpload = async (file: File) => {
    // Balance quality and upload speed for screenshots.
    const bitmap = await createImageBitmap(file)
    const maxWidth = 1920
    const maxHeight = 1080

    let targetWidth = bitmap.width
    let targetHeight = bitmap.height
    const widthRatio = maxWidth / targetWidth
    const heightRatio = maxHeight / targetHeight
    const ratio = Math.min(1, widthRatio, heightRatio)

    targetWidth = Math.max(1, Math.round(targetWidth * ratio))
    targetHeight = Math.max(1, Math.round(targetHeight * ratio))

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

    const safeName =
      file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') ||
      'memory'

    return new File([blob], `${safeName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  }

  const openCreateDialog = () => {
    setMode('create')
    resetDialog()
    setDialogOpen(true)
  }

  const openEditDialog = () => {
    if (!activeItem) {
      return
    }
    setMode('edit')
    setImageFile(null)
    setImagePreviewUrl(activeItem.imageUrl || '')
    setTitle(activeItem.title || '')
    setDescription(activeItem.description || '')
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      if (mode === 'create') {
        if (!imageFile) {
          toast.error('请先上传截图')
          return
        }

        const optimizedImage = await compressImageForUpload(imageFile)
        await createGameMemoryById(gameId, {
          image: optimizedImage,
          title: title.trim(),
          description: description.trim(),
        })
        toast.success('回忆已保存')
      } else {
        if (!activeItem) {
          toast.error('未找到待编辑回忆')
          return
        }

        const optimizedImage = imageFile
          ? await compressImageForUpload(imageFile)
          : undefined

        await updateGameMemoryById(gameId, activeItem.id, {
          title: title.trim(),
          description: description.trim(),
          image: optimizedImage,
        })
        toast.success('回忆已更新')
      }

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

  const handleDelete = async () => {
    if (!activeItem) {
      return
    }

    const confirmDelete = window.confirm('确认删除该回忆吗？')
    if (!confirmDelete) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteGameMemoryById(gameId, activeItem.id)
      toast.success('回忆已删除')
      setDetailOpen(false)
      setActiveItem(null)
      await refetch()
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除失败')
    } finally {
      setIsDeleting(false)
    }
  }

  const activeImageUrl = imagePreviewUrl || activeItem?.imageUrl || ''

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="根据标题搜索回忆"
          className="sm:flex-1"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isLoading || isRefetching}
          onClick={handleSearch}
        >
          搜索
        </Button>
        <Button type="button" onClick={openCreateDialog}>
          <PlusIcon className="size-4" />
          新增
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground rounded-md border p-4 text-sm">
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground rounded-md border p-4 text-sm">
          暂无回忆
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <MemoryCard
              key={item.id}
              item={item}
              onClick={() => {
                setActiveItem(item)
                setDetailOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? '新增游戏回忆' : '编辑游戏回忆'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm">
                截图{mode === 'create' ? '' : '（不上传则保留原图）'}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setImageFile(file)
                }}
              />
              {activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt="截图预览"
                  className="h-36 w-full rounded-md border object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="text-sm">标题（可选）</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入回忆标题（可选）"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm">文本内容（支持 Markdown）</div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-36"
                placeholder="支持 Markdown 语法，例如 # 标题、**加粗**、- 列表"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              取消
            </Button>
            <Button type="button" disabled={isSaving} onClick={handleCreate}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activeItem?.title || '游戏回忆'}</DialogTitle>
          </DialogHeader>

          {activeItem ? (
            <div className="space-y-4">
              {activeItem.imageUrl ? (
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.title || '回忆截图'}
                  className="max-h-[50vh] w-full rounded-md border object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <div className="text-muted-foreground text-xs">
                更新于 {dayjs(activeItem.updatedAt).format('YYYY-MM-DD HH:mm')}
              </div>
              <MdxContent markdown={activeItem.description || ''} />
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={openEditDialog}>
              <PencilIcon className="size-4" />
              编辑
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              <Trash2Icon className="size-4" />
              {isDeleting ? '删除中...' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MemoryCard({
  item,
  onClick,
}: {
  item: GameMemoryItem
  onClick: () => void
}) {
  const updatedAtText = item.updatedAt
    ? dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')
    : '-'

  return (
    <Card
      variant="outline"
      className="gap-3 overflow-hidden py-0 hover:cursor-pointer"
      onClick={onClick}
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title || '回忆截图'}
          className="h-44 w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="text-muted-foreground flex h-44 items-center justify-center border-b text-sm">
          无截图
        </div>
      )}
      <CardHeader className="px-4 pt-0 pb-0">
        {item.title ? (
          <CardTitle className="line-clamp-1">{item.title}</CardTitle>
        ) : null}
        <CardDescription>更新于 {updatedAtText}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4" />
    </Card>
  )
}

function MdxContent({ markdown }: { markdown: string }) {
  const [Content, setContent] = useState<React.ComponentType | null>(null)
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    let cancelled = false

    const compileMdx = async () => {
      try {
        const safeSource = markdown || '（无内容）'
        const result = await evaluate(safeSource, {
          ...runtime,
          useMDXComponents: () => ({}),
        })

        if (!cancelled) {
          setContent(() => result.default)
          setErrorText('')
        }
      } catch {
        if (!cancelled) {
          setContent(null)
          setErrorText('Markdown 渲染失败，请检查语法')
        }
      }
    }

    void compileMdx()
    return () => {
      cancelled = true
    }
  }, [markdown])

  if (errorText) {
    return <div className="text-destructive text-sm">{errorText}</div>
  }

  if (!Content) {
    return <div className="text-muted-foreground text-sm">渲染中...</div>
  }

  return (
    <MDXProvider>
      <article className="prose prose-sm dark:prose-invert max-w-none">
        <Content />
      </article>
    </MDXProvider>
  )
}
