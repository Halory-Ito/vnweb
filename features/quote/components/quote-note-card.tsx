'use client'

import dayjs from 'dayjs'
import { CopyIcon, EditIcon, SparklesIcon, Trash2Icon, UserIcon } from 'lucide-react'
import { memo } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getQuoteNoteTheme } from '@/features/quote/lib/quote-note-theme'
import { cn } from '@/lib/utils'

import type { QuoteManageItem } from '@/types'

type QuoteNoteCardProps = {
  item: QuoteManageItem
  onEdit: (item: QuoteManageItem) => void
  onDelete: (item: QuoteManageItem) => void
}

export const QuoteNoteCard = memo(function QuoteNoteCard({
  item,
  onEdit,
  onDelete,
}: QuoteNoteCardProps) {
  const theme = getQuoteNoteTheme(item.id)
  const gameTitle = item.gameNameCn || item.gameName
  const createdDate = item.createdAt ? dayjs(item.createdAt).format('YYYY/MM/DD') : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content)
      toast.success('已复制台词')
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <article
      className={cn(
        'group bg-background relative mb-5 break-inside-avoid rounded-2xl border-2 px-5 pt-7 pb-4 transition-all duration-300',
        '[content-visibility:auto] [contain-intrinsic-size:auto_220px]',
        'hover:z-10 hover:-translate-y-1 hover:rotate-0 hover:shadow-md',
        theme.border,
        theme.tilt,
      )}
    >
      {/* 顶部和纸胶带装饰 */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-2 rounded-xs border backdrop-blur-[1px]',
          theme.tape,
        )}
      />

      {/* 背景角落大引号水印 */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-2 left-3.5 text-5xl leading-none select-none',
          theme.accent,
        )}
      >
        “
      </span>

      {/* 悬浮操作胶囊 */}
      <div className="bg-background/95 absolute top-2.5 right-2.5 flex items-center gap-0.5 rounded-full border px-1 py-0.5 opacity-0 shadow-xs backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="rounded-full"
              onClick={() => void handleCopy()}
              aria-label="复制台词"
            >
              <CopyIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>复制台词</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="rounded-full"
              onClick={() => onEdit(item)}
              aria-label="编辑摘录"
            >
              <EditIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>编辑</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="text-destructive hover:text-destructive rounded-full"
              onClick={() => onDelete(item)}
              aria-label="删除摘录"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>删除</TooltipContent>
        </Tooltip>
      </div>

      {/* 台词正文 */}
      <p className="relative z-1 mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
        {item.content}
      </p>

      {/* 台词背景/备注 */}
      {item.context ? (
        <p className="text-muted-foreground mt-3 border-t border-dashed pt-2.5 text-xs leading-relaxed">
          {item.context}
        </p>
      ) : null}

      {/* 底部：迷你 Galgame 铭牌 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          {item.characterImage ? (
            <img
              src={item.characterImage}
              alt={item.characterName || '角色头像'}
              loading="lazy"
              className="size-6 shrink-0 rounded-full border object-cover"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full border">
              <UserIcon className="size-3.5" />
            </div>
          )}
          <span className="truncate text-xs font-medium">
            {item.characterName || '未关联角色'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {gameTitle ? (
            <Badge
              variant="outline"
              className={cn('max-w-[140px] truncate rounded-full px-2 py-0 text-[11px]', theme.badge)}
              title={gameTitle}
            >
              {gameTitle}
            </Badge>
          ) : null}
          <SparklesIcon className="text-muted-foreground/50 size-3 animate-pulse" />
        </div>
      </div>

      {createdDate ? (
        <div className="text-muted-foreground/70 mt-1.5 text-right text-[10px]">{createdDate}</div>
      ) : null}
    </article>
  )
})
