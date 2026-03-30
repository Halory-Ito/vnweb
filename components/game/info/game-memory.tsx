'use client'

import { evaluate } from '@mdx-js/mdx'
import { MDXProvider } from '@mdx-js/react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  ImageIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
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
    if (!activeItem || isDeleting) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteGameMemoryById(gameId, activeItem.id)
      toast.success('回忆已删除')
      setDeleteConfirmOpen(false)
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
          {items.map((item, index) => (
            <MemoryCard
              key={item.id}
              item={item}
              index={index}
              onClick={() => {
                setActiveItem(item)
                setDetailOpen(true)
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
            <DialogTitle>
              {mode === 'create' ? '新增游戏回忆' : '编辑游戏回忆'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* 截图上传区域 */}
            <div className="space-y-3">
              <div className="text-sm font-medium">
                截图{mode === 'create' ? '' : '（不上传则保留原图）'}
              </div>

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

      {/* 详情对话框 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden p-0">
          <div className="flex h-full flex-col">
            {/* 头部 */}
            <DialogHeader className="shrink-0 border-b px-6 py-4">
              <DialogTitle className="text-xl">
                {activeItem?.title || '游戏回忆'}
              </DialogTitle>
            </DialogHeader>

            {/* 内容区域 - 可滚动 */}
            {activeItem ? (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* 图片 */}
                {activeItem.imageUrl ? (
                  <div className="mb-4 overflow-hidden rounded-xl border">
                    <img
                      src={activeItem.imageUrl}
                      alt={activeItem.title || '回忆截图'}
                      className="max-h-[40vh] w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}

                {/* 更新时间 */}
                <div className="text-muted-foreground mb-4 flex items-center gap-2 text-xs">
                  <SearchIcon className="size-3" />
                  <span>
                    更新于{' '}
                    {dayjs(activeItem.updatedAt).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>

                {/* 文本内容 */}
                <div className="border-t pt-4">
                  <div className="bg-card max-h-64 overflow-y-auto rounded-lg border p-4">
                    <MdxContent markdown={activeItem.description || ''} />
                  </div>
                </div>
              </div>
            ) : null}

            {/* 底部操作栏 */}
            <DialogFooter className="shrink-0 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={openEditDialog}>
                <PencilIcon className="mr-2 size-4" />
                编辑
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2Icon className="mr-2 size-4" />
                {isDeleting ? '删除中...' : '删除'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除回忆</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除回忆「{activeItem?.title || '未命名回忆'}
              」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting || !activeItem}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  index,
  onClick,
}: {
  item: GameMemoryItem
  index: number
  onClick: () => void
}) {
  const updatedAtText = item.updatedAt
    ? dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')
    : '-'

  return (
    <Card
      variant="outline"
      className={`group relative mt-0 overflow-hidden pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
      onClick={onClick}
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
    return (
      <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
        {errorText}
      </div>
    )
  }

  if (!Content) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <div className="bg-muted h-4 w-4 animate-pulse rounded-full" />
        <span>渲染中...</span>
      </div>
    )
  }

  return (
    <MDXProvider
      components={{
        h1: ({ children }) => (
          <h1 className="mt-6 mb-4 text-2xl font-bold first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-5 mb-3 text-xl font-semibold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-4 mb-2 text-lg font-semibold">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-foreground mb-3 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ children, className }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code className="bg-muted text-primary rounded px-1.5 py-0.5 font-mono text-sm">
                {children}
              </code>
            )
          }
          return <code className={className}>{children}</code>
        },
        pre: ({ children }) => (
          <pre className="bg-muted mb-3 overflow-x-auto rounded-lg p-4">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-primary/30 text-muted-foreground mb-3 border-l-4 pl-4 italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-border my-6" />,
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-primary hover:text-primary/80 underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="text-muted-foreground italic">{children}</em>
        ),
      }}
    >
      <article className="prose prose-sm dark:prose-invert max-w-none">
        <Content />
      </article>
    </MDXProvider>
  )
}
