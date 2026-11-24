'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowLeftIcon, Clock3Icon, ImageIcon, PencilIcon } from 'lucide-react'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Children,
  type ComponentProps,
  Component,
  type ErrorInfo,
  isValidElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

import { getGameMemoryById, updateGameMemoryById } from '@/api'
import { MemoryMetadataIcon } from '@/components/memory-metadata-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GameMemoryFormDialog } from '@/features/game/components/info/game-memory-form-dialog'
import { GameMemoryOstBar } from '@/features/game/components/info/game-memory-ost-bar'
import { compressMemoryImageForUpload } from '@/features/game/hooks/use-game-memory'
import { useMemoryOstAutoPlay } from '@/features/game/hooks/use-memory-ost-autoplay'
import {
  type MemoryFrontmatterEntry,
  parseMemoryFrontmatter,
  parseTagsInput,
  serializeMemoryMarkdown,
} from '@/features/game/lib/memory-frontmatter'
import { useRecordVisit } from '@/features/recent'
import { useMemoryMetadataSettings } from '@/hooks/use-memory-metadata-settings'
import {
  buildMemoryMetadataEntries,
  resolveMemoryMetadataItems,
  splitMemoryMetadataValues,
} from '@/lib/settings/memory-metadata-settings'
import { cn } from '@/lib/utils'

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
  1: 'pl-3',
  2: 'pl-5',
  3: 'pl-7',
  4: 'pl-9',
}

export default function GameMemoryDetailPage() {
  const params = useParams<RouteParams>()
  const gameId = Number(params.id)
  const memoryId = Number(params.memoryId)

  const { fields: metadataFields } = useMemoryMetadataSettings()
  const [editOpen, setEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [keepOriginalImage, setKeepOriginalImage] = useState(true)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [ostSongIds, setOstSongIds] = useState<number[]>([])
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>({})
  const [extraEntries, setExtraEntries] = useState<MemoryFrontmatterEntry[]>([])
  const [body, setBody] = useState('')
  const [activeHeadingId, setActiveHeadingId] = useState('')
  const [contentRenderVersion, setContentRenderVersion] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const selectedPreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ''),
    [imageFile],
  )

  useEffect(() => {
    if (!selectedPreviewUrl) {
      return
    }
    return () => {
      URL.revokeObjectURL(selectedPreviewUrl)
    }
  }, [selectedPreviewUrl])

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['game-memory-detail', gameId, memoryId],
    queryFn: () => getGameMemoryById(gameId, memoryId),
    enabled: Number.isInteger(gameId) && gameId > 0 && Number.isInteger(memoryId) && memoryId > 0,
  })

  useRecordVisit(gameId, 'memory', `/game/info/${gameId}/memory`)

  const item = data?.item
  const parsedMemory = useMemo(
    () => parseMemoryFrontmatter(item?.description || ''),
    [item?.description],
  )
  const metadataItems = useMemo(
    () => resolveMemoryMetadataItems(parsedMemory.extraEntries, metadataFields),
    [parsedMemory.extraEntries, metadataFields],
  )
  const tocItems = useMemo(() => extractTocItems(parsedMemory.body), [parsedMemory.body])
  const hasToc = tocItems.length > 0
  const memoryOst = useMemoryOstAutoPlay({
    memoryId: Number.isInteger(memoryId) && memoryId > 0 ? memoryId : 0,
    ostSongIds: parsedMemory.ostSongIds,
  })

  const handleContentRendered = useCallback(() => {
    setContentRenderVersion((previous) => previous + 1)
  }, [])

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

      setActiveHeadingId((previous) => (previous === currentId ? previous : currentId))
    }

    const frame = window.requestAnimationFrame(() => {
      const hashValue = decodeURIComponent(window.location.hash.replace(/^#/, ''))
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

  const clearEditImage = () => {
    setImageFile(null)
    setKeepOriginalImage(false)
  }

  const setMetadataValue = (key: string, value: string) => {
    setMetadataValues((prev) => ({ ...prev, [key]: value }))
  }

  const resetEditDialog = () => {
    setImageFile(null)
    setKeepOriginalImage(true)
    setTitle('')
    setSummary('')
    setTagsInput('')
    setOstSongIds([])
    setMetadataValues({})
    setExtraEntries([])
    setBody('')
  }

  const openEditDialog = () => {
    if (!item) {
      return
    }

    const parsed = parseMemoryFrontmatter(item.description || '')
    const { values, unmatched } = splitMemoryMetadataValues(parsed.extraEntries, metadataFields)
    setImageFile(null)
    setKeepOriginalImage(true)
    setTitle(item.title || parsed.title)
    setSummary(parsed.summary)
    setTagsInput(parsed.tags.join(', '))
    setOstSongIds(parsed.ostSongIds)
    setMetadataValues(values)
    setExtraEntries(unmatched)
    setBody(parsed.body)
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!item) {
      return
    }

    setIsSaving(true)
    try {
      const optimizedImage = imageFile ? await compressMemoryImageForUpload(imageFile) : undefined
      const mergedExtraEntries = buildMemoryMetadataEntries(
        metadataValues,
        metadataFields,
        extraEntries,
      )
      const serializedDescription = serializeMemoryMarkdown({
        summary,
        tags: parseTagsInput(tagsInput),
        ostSongIds,
        extraEntries: mergedExtraEntries,
        body,
      })

      await updateGameMemoryById(gameId, item.id, {
        title: title.trim(),
        description: serializedDescription,
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

  const editableImageUrl = selectedPreviewUrl || (keepOriginalImage ? item?.imageUrl || '' : '')

  return (
    <div ref={scrollContainerRef} className="mx-auto max-h-[100cqh] w-full overflow-y-auto">
      <div className="@container relative mx-auto w-full max-w-7xl space-y-6 px-4 pt-4 pb-12 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline">
            <Link href={`/game/info/${gameId}/memory`}>
              <ArrowLeftIcon className="mr-2 size-4" />
              返回回忆列表
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!item || isLoading || isRefetching}
            onClick={openEditDialog}
          >
            <PencilIcon className="mr-2 size-4" />
            编辑并保存
          </Button>
        </div>

        <div className={`grid gap-6 ${hasToc ? '@2xl:grid-cols-[minmax(0,1fr)_220px]' : ''}`}>
          <main className="min-w-0 space-y-6">
            {isLoading ? (
              <DetailStateCard title="加载中..." description="正在获取回忆详情，请稍候。" />
            ) : error || !item ? (
              <DetailStateCard
                title="未找到回忆"
                description="该回忆可能已被删除，或当前链接无效。"
              />
            ) : (
              <>
                <Card variant="outline" className="overflow-hidden pt-0 shadow-sm">
                  <div className="bg-muted relative aspect-16/7 w-full">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title || parsedMemory.title || '回忆截图'}
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
                      {item.title || parsedMemory.title || '未命名回忆'}
                    </CardTitle>
                    {parsedMemory.summary ? (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {parsedMemory.summary}
                      </p>
                    ) : null}
                    {parsedMemory.tags.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {parsedMemory.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="rounded-full text-xs font-normal"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3Icon className="size-3" />
                        更新于 {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                      {metadataItems.map((meta) => (
                        <span
                          key={`${meta.key}-${meta.value}`}
                          title={`${meta.label}: ${meta.value}`}
                          className="inline-flex items-center gap-1.5"
                        >
                          <MemoryMetadataIcon icon={meta.icon} className="size-3 shrink-0" />
                          <span>
                            {meta.icon === 'hash' ? `${meta.label}: ${meta.value}` : meta.value}
                          </span>
                        </span>
                      ))}
                    </CardDescription>
                    <GameMemoryOstBar
                      songs={memoryOst.songs}
                      activeSongId={memoryOst.activeSongId}
                      isPlaying={memoryOst.isPlaying}
                      isBuffering={memoryOst.isBuffering}
                      isMemoryPlaying={memoryOst.isMemoryPlaying}
                      onTogglePlayAll={memoryOst.togglePlayAll}
                      onSelectTrack={memoryOst.playTrack}
                    />
                  </CardHeader>
                </Card>

                <Card variant="outline" className="shadow-sm">
                  <CardContent className="px-5 py-6 md:px-8 md:py-8">
                    <MdxRemoteContent
                      markdown={parsedMemory.body}
                      tocItems={tocItems}
                      onRendered={handleContentRendered}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </main>

          {hasToc ? (
            <aside className="order-first h-fit @2xl:sticky @2xl:top-6 @2xl:order-last">
              <div className="bg-background/60 dark:border-input dark:bg-input/30 rounded-xl border">
                <div className="border-border/60 text-muted-foreground border-b px-3.5 py-2.5 text-xs font-medium">
                  目录
                </div>
                <nav className="max-h-56 space-y-0.5 overflow-y-auto p-2 @2xl:max-h-[65vh]">
                  {tocItems.map((tocItem) => {
                    const active = activeHeadingId === tocItem.id
                    return (
                      <a
                        key={tocItem.id}
                        href={`#${tocItem.id}`}
                        onClick={(event) => {
                          event.preventDefault()
                          const targetElement = document.getElementById(tocItem.id)
                          if (!targetElement) {
                            return
                          }

                          targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          })
                          window.history.replaceState(null, '', `#${tocItem.id}`)
                          setActiveHeadingId(tocItem.id)
                        }}
                        className={`relative block rounded-md py-1.5 pr-2.5 text-sm transition-colors ${
                          tocIndentClassByLevel[tocItem.level] || 'pl-3'
                        } ${
                          active
                            ? 'text-foreground bg-muted/60 font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/35'
                        }`}
                        title={tocItem.text}
                      >
                        {active ? (
                          <span className="bg-foreground/70 absolute top-1/2 left-1 h-4 w-0.5 -translate-y-1/2 rounded-full" />
                        ) : null}
                        <span className="line-clamp-2 block">{tocItem.text}</span>
                      </a>
                    )
                  })}
                </nav>
              </div>
            </aside>
          ) : null}
        </div>
      </div>

      <GameMemoryFormDialog
        mode="edit"
        gameId={gameId}
        open={editOpen}
        isSaving={isSaving}
        imagePreviewUrl={editableImageUrl}
        title={title}
        summary={summary}
        tagsInput={tagsInput}
        ostSongIds={ostSongIds}
        metadataValues={metadataValues}
        extraEntries={extraEntries}
        body={body}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) {
            resetEditDialog()
          }
        }}
        onSelectImage={setImageFile}
        onClearImage={clearEditImage}
        onTitleChange={setTitle}
        onSummaryChange={setSummary}
        onTagsInputChange={setTagsInput}
        onOstSongIdsChange={setOstSongIds}
        onMetadataValueChange={setMetadataValue}
        onExtraEntriesChange={setExtraEntries}
        onBodyChange={setBody}
        onSubmit={() => void handleSave()}
      />
    </div>
  )
}

function DetailStateCard({ title, description }: { title: string; description: string }) {
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

const BLOCK_TAGS = new Set([
  'div',
  'center',
  'pre',
  'blockquote',
  'table',
  'ul',
  'ol',
  'figure',
  'hr',
  'section',
  'article',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
])

function MdxCenter({ children, className, ...props }: ComponentProps<'span'>) {
  return (
    <span {...props} className={`my-1 block text-center ${className || ''}`.trim()}>
      {children}
    </span>
  )
}

function MdxPre({ children }: { children?: ReactNode }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-xl border border-slate-700/50 bg-[#282c34]! p-4 shadow-sm">
      {children}
    </pre>
  )
}

function MdxBlockquote({ children }: { children?: ReactNode }) {
  return (
    <blockquote className="border-primary/40 bg-primary/5 text-muted-foreground mb-4 rounded-r-lg border-l-4 px-4 py-2 italic">
      {children}
    </blockquote>
  )
}

function MdxImg({ alt, title, className, ...props }: ComponentProps<'img'>) {
  const caption = typeof alt === 'string' ? alt.trim() : ''
  const tooltipText = title || caption || undefined

  if (!caption) {
    return (
      <img
        {...props}
        alt=""
        title={tooltipText}
        className={cn('my-3 max-w-full rounded-lg', className)}
      />
    )
  }

  return (
    <span className="my-4 flex flex-col items-center gap-2">
      <img
        {...props}
        alt={caption}
        title={tooltipText}
        className={cn('max-w-full rounded-lg', className)}
      />
      <span className="text-muted-foreground text-center text-sm leading-normal">{caption}</span>
    </span>
  )
}

function hasBlockChild(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement(child)) {
      return false
    }
    if (
      (typeof child.type === 'string' && BLOCK_TAGS.has(child.type)) ||
      child.type === MdxCenter ||
      child.type === MdxPre ||
      child.type === MdxBlockquote ||
      child.type === MdxImg
    ) {
      return true
    }
    const nested = (child.props as { children?: ReactNode } | null)?.children
    return nested ? hasBlockChild(nested) : false
  })
}

const mdxComponents = {
  h1: ({ children }: any) => (
    <Heading tag="h1" className="mt-10 mb-4 text-3xl font-semibold first:mt-0 md:text-4xl">
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
  p: ({ children }: any) =>
    hasBlockChild(children) ? (
      <div className="text-foreground mb-5 text-[1.05rem] leading-8 md:text-[1.1rem]">
        {children}
      </div>
    ) : (
      <p className="text-foreground mb-5 text-[1.05rem] leading-8 md:text-[1.1rem]">{children}</p>
    ),
  center: MdxCenter,
  img: MdxImg,
  ul: ({ children }: any) => <ul className="mb-4 list-disc space-y-1.5 pl-6">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-4 list-decimal space-y-1.5 pl-6">{children}</ol>,
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
        <code className="bg-muted text-primary rounded px-1.5 py-0.5 text-[0.9em]">{children}</code>
      )
    }
    return (
      <code className={`${className} bg-transparent p-0 text-sm leading-relaxed`}>{children}</code>
    )
  },
  pre: MdxPre,
  blockquote: MdxBlockquote,
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
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: any) => <em className="text-muted-foreground italic">{children}</em>,
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
    <del className="text-muted-foreground line-through opacity-70">{children}</del>
  ),
}

function MdxRemoteContent({
  markdown,
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
      <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{errorText}</div>
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
