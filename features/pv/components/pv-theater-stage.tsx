'use client'

import {
  ExternalLinkIcon,
  FilmIcon,
  PencilIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getHostname, getYouTubeCover, toDisplayDate } from '@/features/pv/lib/pv-utils'

import type { PvItem } from '../types'

type ResolvedVideo = {
  mode: 'direct' | 'embed' | 'none'
  embedUrl: string
  playUrl: string
}

type PvTheaterStageProps = {
  item: PvItem | null
  resolvedVideo: ResolvedVideo
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  onVideoRef: (el: HTMLVideoElement | null) => void
  onEdit: (item: PvItem) => void
  onDelete: (item: PvItem) => void
}

export function PvTheaterStage({
  item,
  resolvedVideo,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onVideoRef,
  onEdit,
  onDelete,
}: PvTheaterStageProps) {
  const [isPlayingMode, setIsPlayingMode] = useState(false)
  const [prevItemId, setPrevItemId] = useState<number | null>(null)

  if ((item?.id ?? null) !== prevItemId) {
    setPrevItemId(item?.id ?? null)
    setIsPlayingMode(false)
  }

  if (!item) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center sm:h-80">
        <div className="mb-3 flex size-14 items-center justify-center rounded-full border border-sky-300/60 bg-sky-50/50 text-sky-500 dark:border-sky-400/30 dark:bg-sky-950/20">
          <FilmIcon className="size-6" />
        </div>
        <p className="text-sm font-medium">PV 特设放映厅</p>
        <p className="text-muted-foreground mt-1 text-xs">
          在下方胶片带中选择任意一卷 PV，即可展开视觉海报与放映
        </p>
      </div>
    )
  }

  const cover = getYouTubeCover(item.url) || item.gameBg || item.gameCover
  const gameTitle = item.gameNameCn || item.gameName || '未关联游戏'

  return (
    <div className="overflow-hidden rounded-2xl border-2">
      <div className="bg-muted/20 relative aspect-video max-h-[460px] w-full overflow-hidden">
        {isPlayingMode ? (
          <>
            {resolvedVideo.mode === 'direct' ? (
              <video
                key={resolvedVideo.playUrl}
                ref={onVideoRef}
                src={resolvedVideo.playUrl}
                controls
                autoPlay
                playsInline
                className="h-full w-full bg-black object-contain"
              />
            ) : resolvedVideo.mode === 'embed' ? (
              <iframe
                key={resolvedVideo.embedUrl}
                src={resolvedVideo.embedUrl}
                title={item.name}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  该链接暂不支持站内直连播放，请在原网页打开观看
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon className="size-4" />
                    在原网页打开
                  </a>
                </Button>
              </div>
            )}
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => setIsPlayingMode(false)}
              aria-label="收起播放器"
              className="bg-background/80 absolute top-3 right-3 z-10 rounded-full backdrop-blur-xs"
            >
              <XIcon className="size-4" />
            </Button>
          </>
        ) : (
          <div className="relative flex h-full w-full items-end p-5 sm:p-8">
            {cover ? (
              <img
                src={cover}
                alt={item.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="from-primary/15 via-background to-muted/40 absolute inset-0 bg-gradient-to-br" />
            )}
            <div className="from-background via-background/75 to-background/10 absolute inset-0 bg-gradient-to-t" />
            <div className="from-background/85 absolute inset-0 bg-gradient-to-r via-transparent to-transparent" />

            <div className="relative z-10 flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-background/70 rounded-full backdrop-blur-xs">
                    {gameTitle}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-background/70 rounded-full text-[11px] backdrop-blur-xs"
                  >
                    {getHostname(item.url)}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {toDisplayDate(item.createdAt)}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight sm:text-3xl">{item.name}</h2>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsPlayingMode(true)}
                  className="rounded-full px-4"
                >
                  <PlayIcon className="size-4 fill-current" />
                  立即放映
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={!hasPrev}
                  onClick={onPrev}
                  aria-label="上一卷"
                  className="bg-background/70 rounded-full backdrop-blur-xs"
                >
                  <SkipBackIcon className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={!hasNext}
                  onClick={onNext}
                  aria-label="下一卷"
                  className="bg-background/70 rounded-full backdrop-blur-xs"
                >
                  <SkipForwardIcon className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  asChild
                  className="bg-background/70 rounded-full backdrop-blur-xs"
                >
                  <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="原网页">
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onEdit(item)}
                  aria-label="编辑"
                  className="bg-background/70 rounded-full backdrop-blur-xs"
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onDelete(item)}
                  aria-label="删除"
                  className="bg-background/70 rounded-full backdrop-blur-xs"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
