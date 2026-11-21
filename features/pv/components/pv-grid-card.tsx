'use client'

import { ExternalLinkIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { getPlayableUrl } from '../hooks/use-pv-playback'
import { formatPvDuration, getPvCategoryName, getPvSource, PV_FILTERS } from '../lib/pv-library'
import { PvCover } from './pv-cover'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { PvCategoryFilter } from '../lib/pv-library'
import type { PvItem } from '../types'

const SPROCKET_SLOTS = Array.from({ length: 10 }, (_, idx) => idx)

type PvGridCardProps = {
  item: PvItem
  index: number
  activeCategory: PvCategoryFilter
  onSelect: (item: PvItem) => void
  onEdit: (item: PvItem) => void
  onDelete: (item: PvItem) => void
}

export function PvGridCard({
  item,
  index,
  activeCategory,
  onSelect,
  onEdit,
  onDelete,
}: PvGridCardProps) {
  const cutLabel = `CUT ${String(index + 1).padStart(2, '0')}`
  const categoryName = getPvCategoryName(item.metadata?.category)
  const showCategory = Boolean(categoryName) && activeCategory === null
  const tags = [
    ...(showCategory ? [categoryName] : []),
    ...PV_FILTERS.flatMap(({ key }) => {
      const value = item.metadata?.[key]
      return value ? [value] : []
    }),
  ].slice(0, 3)
  const duration = item.metadata?.duration
  const sourceLabel = getPvSource(item.url)
  const externalUrl = getPlayableUrl(item.url)

  return (
    <article className="group bg-card/75 hover:border-primary/60 relative flex h-full flex-col overflow-hidden rounded-xl border-2 transition-[translate,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <button
        type="button"
        aria-label={`播放 ${item.name}`}
        aria-haspopup="dialog"
        onClick={() => onSelect(item)}
        className="focus-visible:ring-ring absolute inset-0 z-10 size-full cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      />

      {/* 顶部胶片片头栏：放映序号 + 来源/时长 */}
      <div className="border-border/60 bg-background/60 text-muted-foreground flex items-center justify-between gap-2 border-b px-3 py-1.5 text-[11px] tracking-wider tabular-nums">
        <span className="flex items-center gap-1.5 font-medium">
          <span
            aria-hidden="true"
            className="bg-primary/70 inline-block size-1.5 rounded-full transition-transform duration-300 group-hover:scale-125"
          />
          {cutLabel}
        </span>
        <span className="flex min-w-0 items-center gap-2 truncate">
          {sourceLabel !== '未知来源' && <span className="truncate">{sourceLabel}</span>}
          {duration ? (
            <span className="text-foreground/80 shrink-0 font-medium">
              {formatPvDuration(duration)}
            </span>
          ) : null}
        </span>
      </div>

      {/* 主画幅 16:9 电影视窗 */}
      <div className="relative aspect-video overflow-hidden">
        <PvCover item={item} zoomOnGroupHover className="size-full" />

        {/* 暗部渐变遮罩，保证海报压字在亮/暗主题与任意封面下都清晰 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/88 via-black/32 to-black/10 transition-opacity duration-300 group-hover:opacity-95"
        />

        {/* 右上角悬浮快捷操作 */}
        <div className="absolute top-2 right-2 z-20 flex translate-y-1 items-center gap-0.5 rounded-full border border-white/20 bg-black/60 px-1 py-0.5 text-white opacity-0 backdrop-blur-xs transition-[opacity,translate] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100 motion-reduce:transition-none pointer-coarse:translate-y-0 pointer-coarse:opacity-100">
          {externalUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="rounded-full text-white/85 hover:bg-white/15 hover:text-white"
                  asChild
                >
                  <a href={externalUrl} target="_blank" rel="noreferrer" aria-label="打开原始链接">
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>打开原始链接</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                className="rounded-full text-white/85 hover:bg-white/15 hover:text-white"
                onClick={() => onEdit(item)}
                aria-label="编辑 PV"
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
                size="icon-xs"
                variant="ghost"
                className="rounded-full text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
                onClick={() => onDelete(item)}
                aria-label="删除 PV"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除</TooltipContent>
          </Tooltip>
        </div>

        {/* 画幅底部海报排版：游戏名 + PV 标题 + 标签 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <div className="min-w-0 space-y-1">
            {(item.gameNameCn || item.gameName) && (
              <p className="truncate text-[11px] tracking-wide text-white/75">
                {item.gameNameCn || item.gameName}
              </p>
            )}
            <h2
              className="line-clamp-2 text-sm leading-snug font-semibold text-white drop-shadow-xs"
              title={item.name}
            >
              {item.name}
            </h2>
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="max-w-28 truncate rounded border border-white/25 bg-black/35 px-1.5 py-0.5 text-[10px] leading-none text-white/90"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部 35mm 胶片齿孔装饰边条 */}
      <div
        aria-hidden="true"
        className="border-border/60 bg-background/60 flex items-center justify-between border-t px-3 py-1.5"
      >
        {SPROCKET_SLOTS.map((slot) => (
          <span
            key={slot}
            className="border-border/80 bg-muted/60 h-1.5 w-2.5 rounded-[2px] border"
          />
        ))}
      </div>
    </article>
  )
}
