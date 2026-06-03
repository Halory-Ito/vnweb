'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  ArrowLeftIcon,
  Clock3Icon,
  ImageIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import 'highlight.js/styles/atom-one-dark.css'
import {
  isValidElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Component,
  type ErrorInfo,
} from 'react'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
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
import { getGameMemoryById, updateGameMemoryById } from '@/lib/game/game-utils'

type RouteParams = {
  id: string
  memoryId: string
}

type TocItem = {
  id: string
  text: string
  level: number
}

const slugifyHeading = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'section'
}

const normalizeHeadingText = (value: string) =>
  value
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()

const extractTocItems = (markdown: string): TocItem[] => {
  const lines = markdown.split(/\r?\n/)
  const tocItems: TocItem[] = []
  const usedIds = new Map<string, number>()
  let inCodeFence = false

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence
      continue
    }

    if (inCodeFence) {
      continue
    }

    const matched = line.match(/^\s{0,3}(#{1,4})\s+(.+?)\s*#*\s*$/)
    if (!matched) {
      continue
    }

    const level = matched[1].length
    const text = normalizeHeadingText(matched[2]) || '未命名小节'
    const id = slugifyHeading(text) || 'section'
    tocItems.push({ id, text, level })
  }

  return tocItems
}

const getNodeText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => getNodeText(child)).join('')
  }

  if (isValidElement(node)) {
    return getNodeText((node.props as { children?: ReactNode }).children)
  }

  return ''
}

const tocIndentClassByLevel: Record<number, string> = {
  1: 'pl-4',
  2: 'pl-7',
  3: 'pl-10',
  4: 'pl-12',
}

export default function GameMemoryDetailPage() {
  const params = useParams<RouteParams>()
  const gameId = Number(params.id)
  const memoryId = Number(params.memoryId)

  const [editOpen, setEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activeHeadingId, setActiveHeadingId] = useState('')
  const [contentRenderVersion, setContentRenderVersion] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['game-memory-detail', gameId, memoryId],
    queryFn: () => getGameMemoryById(gameId, memoryId),
    enabled:
      Number.isInteger(gameId) &&
      gameId > 0 &&
      Number.isInteger(memoryId) &&
      memoryId > 0,
  })

  const item = data?.item
  const tocItems = useMemo(
    () => extractTocItems(item?.description || ''),
    [item?.description],
  )
  const hasToc = tocItems.length > 0

  const handleContentRendered = useCallback(() => {
    setContentRenderVersion((previous) => previous + 1)
  }, [])

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

  useEffect(() => {
    if (tocItems.length === 0) {
      setActiveHeadingId('')
      return
    }

    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) {
      return
    }

    const updateActiveHeading = () => {
      const containerTop = scrollContainer.getBoundingClientRect().top
      const activationLine = containerTop + 160
      let currentId = tocItems[0].id

      for (const tocItem of tocItems) {
        const heading = document.getElementById(tocItem.id)
        if (!heading) {
          continue
        }

        if (heading.getBoundingClientRect().top <= activationLine) {
          currentId = tocItem.id
        } else {
          break
        }
      }

      setActiveHeadingId((previous) =>
        previous === currentId ? previous : currentId,
      )
    }

    const frame = window.requestAnimationFrame(() => {
      const hashValue = decodeURIComponent(
        window.location.hash.replace(/^#/, ''),
      )
      if (hashValue) {
        const hashTarget = document.getElementById(hashValue)
        if (hashTarget) {
          hashTarget.scrollIntoView({ block: 'start' })
          setActiveHeadingId(hashValue)
          return
        }
      }

      updateActiveHeading()
    })

    scrollContainer.addEventListener('scroll', updateActiveHeading, {
      passive: true,
    })
    window.addEventListener('resize', updateActiveHeading)

    return () => {
      window.cancelAnimationFrame(frame)
      scrollContainer.removeEventListener('scroll', updateActiveHeading)
      window.removeEventListener('resize', updateActiveHeading)
    }
  }, [tocItems, contentRenderVersion])

  const resetEditDialog = () => {
    setImageFile(null)
    setImagePreviewUrl('')
    setTitle('')
    setDescription('')
  }

  const openEditDialog = () => {
    if (!item) {
      return
    }

    setImageFile(null)
    setImagePreviewUrl(item.imageUrl || '')
    setTitle(item.title || '')
    setDescription(item.description || '')
    setEditOpen(true)
  }

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

  const handleSave = async () => {
    if (!item) {
      return
    }

    setIsSaving(true)
    try {
      const optimizedImage = imageFile
        ? await compressImageForUpload(imageFile)
        : undefined

      await updateGameMemoryById(gameId, item.id, {
        title: title.trim(),
        description: description.trim(),
        image: optimizedImage,
      })

      toast.success('回忆已更新')
      setEditOpen(false)
      await refetch()
    } catch (updateError) {
      const err = updateError as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const editableImageUrl = imagePreviewUrl || item?.imageUrl || ''

  return (
    <div
      ref={scrollContainerRef}
      className="mx-auto max-h-[calc(100vh-70px)] w-full overflow-y-auto"
    >
      <div className="relative mx-auto w-full max-w-7xl px-4 pt-4 pb-12 md:px-6">
        {/* <div className="via-background to-background pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-linear-to-b from-amber-300/20" /> */}

        <div
          className={`grid gap-6 ${hasToc ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : 'lg:grid-cols-1'}`}
        >
          <main className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button asChild variant="outline" className="backdrop-blur-sm">
                <Link href={`/game/info/${gameId}/memory`}>
                  <ArrowLeftIcon className="mr-2 size-4" />
                  返回回忆列表
                </Link>
              </Button>

              <Button
                type="button"
                className="shadow-sm"
                disabled={!item || isLoading || isRefetching}
                onClick={openEditDialog}
              >
                <PencilIcon className="mr-2 size-4" />
                编辑并保存
              </Button>
            </div>

            {isLoading ? (
              <DetailStateCard
                title="加载中..."
                description="正在获取回忆详情，请稍候。"
              />
            ) : error || !item ? (
              <DetailStateCard
                title="未找到回忆"
                description="该回忆可能已被删除，或当前链接无效。"
              />
            ) : (
              <>
                <Card
                  variant="outline"
                  className="overflow-hidden pt-0 shadow-sm"
                >
                  <div className="bg-muted relative aspect-16/7 w-full">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title || '回忆截图'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="text-muted-foreground size-14" />
                      </div>
                    )}
                  </div>

                  <CardHeader className="space-y-3">
                    <CardTitle className="text-3xl leading-tight md:text-4xl">
                      {item.title || '未命名回忆'}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-4 text-xs tracking-wide uppercase">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3Icon className="size-3" />
                        更新于{' '}
                        {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card variant="outline" className="shadow-sm">
                  <CardContent className="px-5 py-6 md:px-8 md:py-8">
                    <MdxRemoteContent
                      markdown={item.description || ''}
                      tocItems={tocItems}
                      onRendered={handleContentRendered}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </main>

          {hasToc ? (
            <aside className="h-fit lg:sticky lg:top-16">
              <Card
                variant="outline"
                className="via-background to-background overflow-hidden border-amber-200/40 bg-linear-to-b from-amber-100/35 shadow-sm"
              >
                <CardHeader className="border-border/70 border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-wide"></CardTitle>
                </CardHeader>
                <CardContent className="max-h-[65vh] overflow-y-auto px-3 py-3">
                  <nav className="space-y-1.5">
                    {tocItems.map((tocItem) => {
                      const active = activeHeadingId === tocItem.id
                      return (
                        <a
                          key={tocItem.id}
                          href={`#${tocItem.id}`}
                          onClick={(event) => {
                            event.preventDefault()
                            const targetElement = document.getElementById(
                              tocItem.id,
                            )
                            if (!targetElement) {
                              return
                            }

                            targetElement.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            })
                            window.history.replaceState(
                              null,
                              '',
                              `#${tocItem.id}`,
                            )
                            setActiveHeadingId(tocItem.id)
                          }}
                          className={`group relative block rounded-lg border px-3 py-2 text-sm transition-all ${
                            tocIndentClassByLevel[tocItem.level] || 'pl-0'
                          } ${
                            active
                              ? 'text-foreground border-amber-500/40 bg-amber-500/10 font-medium shadow-xs'
                              : 'text-muted-foreground hover:text-foreground border-transparent hover:border-amber-500/20 hover:bg-amber-500/5'
                          }`}
                          title={tocItem.text}
                        >
                          <span
                            className={`absolute top-1/2 left-1.5 h-5 w-1 -translate-y-1/2 rounded-full transition-all ${
                              active
                                ? 'bg-amber-500/70 opacity-100'
                                : 'bg-amber-400/40 opacity-0 group-hover:opacity-100'
                            }`}
                          />
                          <span className="line-clamp-2 block pr-1">
                            {tocItem.text}
                          </span>
                        </a>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>
            </aside>
          ) : null}
        </div>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) {
            resetEditDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>编辑游戏回忆</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-3">
              <div className="text-sm font-medium">
                截图（不上传则保留原图）
              </div>

              {editableImageUrl ? (
                <div className="group relative overflow-hidden rounded-xl border">
                  <img
                    src={editableImageUrl}
                    alt="截图预览"
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
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
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        setImageFile(file)
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">标题（可选）</div>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="给这个回忆起个名字..."
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">
                文本内容（支持 Markdown）
              </div>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-32 resize-none font-mono text-sm"
                placeholder="记录你的游戏体验，支持 Markdown 语法..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              取消
            </Button>
            <Button type="button" disabled={isSaving} onClick={handleSave}>
              {isSaving ? '保存中...' : '保存回忆'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailStateCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card variant="outline">
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
          <ImageIcon className="text-muted-foreground size-7" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}

class MDXErrorBoundary extends Component<
  { children: ReactNode; fallbackText: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallbackText: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MDX rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          {this.props.fallbackText} ({this.state.error?.message})
        </div>
      )
    }
    return this.props.children
  }
}

function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let isCancelled = false
    import('mermaid').then((m) => {
      if (isCancelled) return
      const mermaid = m.default
      mermaid.initialize({ startOnLoad: false, theme: 'default' })
      const id = `mermaid-${Math.random().toString(36).substring(2)}`
      mermaid
        .render(id, chart)
        .then(({ svg }) => {
          if (!isCancelled && containerRef.current) {
            containerRef.current.innerHTML = svg
          }
        })
        .catch((e) => {
          console.error('Mermaid render error', e)
          if (!isCancelled && containerRef.current) {
            containerRef.current.innerHTML = `<div class="text-destructive text-sm p-4 border border-destructive/30 rounded-xl bg-destructive/10">Mermaid 渲染错误，请检查语法</div>`
          }
        })
    })

    return () => {
      isCancelled = true
    }
  }, [chart])

  return (
    <div
      ref={containerRef}
      className="mermaid-container flex justify-center overflow-x-auto py-4"
    />
  )
}

const Heading = ({
  tag: Tag,
  className,
  children,
}: {
  tag: any
  className: string
  children: ReactNode
}) => {
  const fallbackId = slugifyHeading(getNodeText(children)) || 'section'
  return (
    <Tag id={fallbackId} className={`group scroll-mt-24 ${className}`}>
      {children}
      <a
        href={`#${fallbackId}`}
        className="text-muted-foreground ml-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="复制锚点"
      >
        #
      </a>
    </Tag>
  )
}

const mdxComponents = {
  h1: ({ children }: any) => (
    <Heading
      tag="h1"
      className="mt-10 mb-4 text-3xl font-semibold first:mt-0 md:text-4xl"
    >
      {children}
    </Heading>
  ),
  h2: ({ children }: any) => (
    <Heading tag="h2" className="mt-8 mb-3 text-2xl font-semibold">
      {children}
    </Heading>
  ),
  h3: ({ children }: any) => (
    <Heading tag="h3" className="mt-7 mb-3 text-xl font-semibold">
      {children}
    </Heading>
  ),
  h4: ({ children }: any) => (
    <Heading tag="h4" className="mt-6 mb-2 text-lg font-semibold">
      {children}
    </Heading>
  ),
  p: ({ children }: any) => (
    <p className="text-foreground mb-5 text-[1.05rem] leading-8 md:text-[1.1rem]">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-6">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-6">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-[1.02rem] leading-8 md:text-[1.08rem]">{children}</li>
  ),
  code: ({ children, className }: any) => {
    const langMatch = /language-(\w+)/.exec(className || '')
    const lang = langMatch ? langMatch[1] : ''

    if (lang === 'mermaid') {
      return <MermaidDiagram chart={String(children)} />
    }

    const isInline = !className
    if (isInline) {
      return (
        <code className="bg-muted text-primary rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          {children}
        </code>
      )
    }
    return (
      <code
        className={`${className} bg-transparent p-0 font-mono text-sm leading-relaxed`}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }: any) => (
    <pre className="mb-4 overflow-x-auto rounded-xl border border-slate-700/50 !bg-[#282c34] p-4 shadow-sm">
      {children}
    </pre>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-primary/40 bg-primary/5 text-muted-foreground mb-4 rounded-r-lg border-l-4 px-4 py-2 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-8" />,
  a: ({ children, href }: any) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="text-muted-foreground italic">{children}</em>
  ),
  span: ({ children, style, className, ...props }: any) => (
    <span style={style} className={className} {...props}>
      {children}
    </span>
  ),
  mark: ({ children }: any) => (
    <mark className="rounded bg-amber-500/30 px-1 text-amber-900 dark:text-amber-200">
      {children}
    </mark>
  ),
  del: ({ children }: any) => (
    <del className="text-muted-foreground line-through opacity-70">
      {children}
    </del>
  ),
}

function MdxRemoteContent({
  markdown,
  tocItems,
  onRendered,
}: {
  markdown: string
  tocItems: TocItem[]
  onRendered?: () => void
}) {
  const [compiledSource, setCompiledSource] = useState<MDXRemoteSerializeResult<
    Record<string, unknown>
  > | null>(null)
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    let cancelled = false

    const compile = async () => {
      try {
        let safeSource = markdown || '（无内容）'
        safeSource = safeSource.replace(/==([^=]+)==/g, '<mark>$1</mark>')

        const result = await serialize(safeSource, {
          mdxOptions: {
            format: 'mdx',
            remarkPlugins: [remarkGfm],
            rehypePlugins: [[rehypeHighlight, { ignoreMissing: true }]],
          },
          parseFrontmatter: false,
        })

        if (!cancelled) {
          setCompiledSource(result)
          setErrorText('')
        }
      } catch {
        if (!cancelled) {
          setCompiledSource(null)
          setErrorText('Markdown 渲染失败，请检查语法')
        }
      }
    }

    void compile()
    return () => {
      cancelled = true
    }
  }, [markdown])

  useEffect(() => {
    if (compiledSource) {
      onRendered?.()
    }
  }, [compiledSource, onRendered])

  if (errorText) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
        {errorText}
      </div>
    )
  }

  if (!compiledSource) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <div className="bg-muted h-4 w-4 animate-pulse rounded-full" />
        <span>渲染中...</span>
      </div>
    )
  }

  return (
    <article className="prose prose-lg prose-slate dark:prose-invert max-w-none leading-8">
      <MDXErrorBoundary fallbackText="Markdown 内容存在不支持的标签或格式，无法渲染。">
        <MDXRemote {...compiledSource} components={mdxComponents} />
      </MDXErrorBoundary>
    </article>
  )
}
