'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ImageIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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
  getGameMemoriesById,
  type GameMemoryItem,
} from '@/lib/game-utils'

type GameMemoryProps = {
  gameId: number
}

export default function GameMemory({ gameId }: GameMemoryProps) {
  const router = useRouter()
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
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
    resetDialog()
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
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
  const activeImageUrl = imagePreviewUrl || ''

  return (
    <div className="space-y-6">
      {/* 搜索和操作栏 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="搜索回忆..."
            className="pl-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isRefetching}
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button type="button" onClick={openCreateDialog}>
            <PlusIcon className="mr-2 size-4" />
            新增回忆
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        <EmptyState
          icon={SearchIcon}
          title="加载中..."
          description="正在获取回忆数据"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="暂无回忆"
          description="点击「新增回忆」记录你的游戏精彩瞬间"
          action={
            <Button type="button" onClick={openCreateDialog} className="mt-4">
              <PlusIcon className="mr-2 size-4" />
              创建第一个回忆
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MemoryCard
              key={item.id}
              item={item}
              onClick={() => {
                router.push(`/game/info/${gameId}/memory/${item.id}`)
              }}
            />
          ))}
        </div>
      )}

      {/* 新增/编辑对话框 */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            resetDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>新增游戏回忆</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* 截图上传区域 */}
            <div className="space-y-3">
              <div className="text-sm font-medium">截图</div>

              {activeImageUrl ? (
                <div className="group relative overflow-hidden rounded-xl border">
                  <img
                    src={activeImageUrl}
                    alt="截图预览"
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* 删除图片按钮 */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreviewUrl(null)
                    }}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-border hover:border-primary/50 rounded-xl border-2 border-dashed transition-colors duration-200">
                  <label className="flex cursor-pointer flex-col items-center justify-center p-8">
                    <ImageIcon className="text-muted-foreground mb-2 size-10" />
                    <span className="text-muted-foreground text-sm">
                      点击上传截图
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        setImageFile(file)
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* 标题输入 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">标题（可选）</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给这个回忆起个名字..."
              />
            </div>

            {/* 文本内容 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">
                文本内容（支持 Markdown）
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32 resize-none font-mono text-sm"
                placeholder="记录你的游戏体验，支持 Markdown 语法..."
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
              {isSaving ? '保存中...' : '保存回忆'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof ImageIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
      <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      {action}
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
      className="group relative mt-0 cursor-pointer overflow-hidden pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
    >
      {/* 封面图片 - 占满卡片顶部 */}
      <div className="bg-muted relative aspect-4/3 w-full">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title || '回忆截图'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="text-muted-foreground size-12" />
          </div>
        )}
        {/* 悬停遮罩 */}
        {/* <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" /> */}
      </div>

      {/* 卡片内容 */}
      <div className="space-y-1 p-4">
        {item.title ? (
          <h3 className="line-clamp-1 text-base font-semibold">{item.title}</h3>
        ) : (
          <h3 className="text-muted-foreground line-clamp-1 text-base italic">
            暂无标题
          </h3>
        )}
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <SearchIcon className="size-3" />
          <span>{updatedAtText}</span>
        </p>
      </div>

      {/* 悬停时显示的内容预览 */}
      {item.description && (
        <div className="from-background/95 pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t to-transparent px-4 pt-8 pb-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {item.description.slice(0, 100)}
            {item.description.length > 100 ? '...' : ''}
          </p>
        </div>
      )}
    </Card>
  )
}
