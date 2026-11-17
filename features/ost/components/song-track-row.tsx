'use client'

import {
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
} from 'lucide-react'
import { memo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { OstSongItem } from '@/types'

type SongTrackRowProps = {
  index: number
  item: OstSongItem
  isActive: boolean
  isPlaying: boolean
  isBuffering: boolean
  onPlay: (item: OstSongItem) => void
  onEdit: (item: OstSongItem) => void
  onDelete: (item: OstSongItem) => void
  onPreviewLyric: (item: OstSongItem) => void
}

export const SongTrackRow = memo(function SongTrackRow({
  index,
  item,
  isActive,
  isPlaying,
  isBuffering,
  onPlay,
  onEdit,
  onDelete,
  onPreviewLyric,
}: SongTrackRowProps) {
  const hasLyric = Boolean(item.lyricsText || item.lyricsPath)

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all sm:px-4',
        isActive
          ? 'border-primary/70 bg-primary/5 shadow-xs'
          : 'border-transparent hover:border-border hover:bg-muted/35',
      )}
    >
      {/* 音轨序号 / 播放按钮 */}
      <button
        type="button"
        onClick={() => onPlay(item)}
        aria-label={isActive && isPlaying ? '暂停' : '播放'}
        className={cn(
          'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border text-xs font-mono transition-colors',
          isActive
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background group-hover:border-primary/60',
        )}
      >
        {isActive && isBuffering ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : isActive && isPlaying ? (
          <PauseIcon className="size-3.5" />
        ) : (
          <>
            <span className="group-hover:hidden">{String(index + 1).padStart(2, '0')}</span>
            <PlayIcon className="hidden size-3.5 group-hover:block" />
          </>
        )}
      </button>

      {/* 曲目名称与格式 */}
      <button
        type="button"
        onClick={() => onPlay(item)}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <span className={cn('truncate text-sm font-medium', isActive && 'text-primary')}>
            {item.name}
          </span>
          {item.mediaType ? (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full px-1.5 py-0 text-[10px] uppercase"
            >
              {item.mediaType}
            </Badge>
          ) : null}
        </div>
      </button>

      {/* 右侧状态与悬浮操作 */}
      <div className="flex shrink-0 items-center gap-1.5">
        {hasLyric ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="rounded-full text-[11px]"
                onClick={() => onPreviewLyric(item)}
              >
                <FileTextIcon className="size-3" />
                <span className="hidden sm:inline">歌词</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>查看歌词</TooltipContent>
          </Tooltip>
        ) : null}

        <div className="flex items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          {item.url ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full"
                  asChild
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="打开音频源链接"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>音频源链接</TooltipContent>
            </Tooltip>
          ) : null}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="rounded-full"
                onClick={() => onEdit(item)}
                aria-label="编辑曲目"
              >
                <PencilIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>编辑</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-destructive hover:text-destructive rounded-full"
                onClick={() => onDelete(item)}
                aria-label="删除曲目"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
})
