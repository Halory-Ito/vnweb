'use client'

import dayjs from 'dayjs'
import { ArrowUpRightIcon, CheckIcon, Clock3Icon, ImageIcon } from 'lucide-react'
import Link from 'next/link'

import { parseMemoryFrontmatter } from '../../lib/memory-frontmatter'
import { MemoryMetadataIcon } from '@/components/memory-metadata-icon'
import { Badge } from '@/components/ui/badge'
import { useMemoryMetadataSettings } from '@/hooks/use-memory-metadata-settings'
import { resolveMemoryMetadataItems } from '@/lib/settings/memory-metadata-settings'
import { cn } from '@/lib/utils'

import type { GameMemoryItem } from '@/types'

type GameMemoryCardProps = {
  gameId: number
  item: GameMemoryItem
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: number) => void
}

export function GameMemoryCard({
  gameId,
  item,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: GameMemoryCardProps) {
  const { fields } = useMemoryMetadataSettings()
  const parsed = parseMemoryFrontmatter(item.description || '')
  const metadataItems = resolveMemoryMetadataItems(parsed.extraEntries, fields)
  const displayTitle = item.title || parsed.title
  const displayDate = item.updatedAt ? dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm') : '-'

  return (
    <Link
      href={`/game/info/${gameId}/memory/${item.id}`}
      onClick={(event) => {
        if (!onToggleSelect) {
          return
        }
        if (selectionMode || event.ctrlKey || event.metaKey) {
          event.preventDefault()
          onToggleSelect(item.id)
        }
      }}
      className={cn(
        'group bg-background/60 hover:border-primary/50 hover:bg-background/75 focus-visible:ring-ring dark:border-input dark:bg-input/30 dark:hover:bg-input/45 flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
        isSelected && 'border-primary ring-primary/40 ring-2',
      )}
    >
      <div className="bg-muted/40 relative aspect-video w-full overflow-hidden">
        {item.imageUrl ? (
          <>
            <img
              src={item.imageUrl}
              alt={displayTitle || '回忆截图'}
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/35 via-black/10 to-transparent" />
          </>
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="text-muted-foreground/50 size-10" />
          </div>
        )}

        {onToggleSelect ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onToggleSelect(item.id)
            }}
            aria-label={isSelected ? '取消选择' : '选择'}
            className={cn(
              'absolute top-2.5 left-2.5 z-10 flex size-7 items-center justify-center rounded-full border-2 transition-all',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground scale-100 opacity-100'
                : selectionMode
                  ? 'border-muted-foreground/60 bg-background/80 scale-95 opacity-100'
                  : 'border-muted-foreground/50 bg-background/75 scale-90 opacity-100 md:opacity-0 md:group-hover:scale-100 md:group-hover:opacity-100',
            )}
          >
            {isSelected ? <CheckIcon className="size-4" /> : null}
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
        {displayTitle ? (
          <h3 className="line-clamp-1 text-sm font-semibold tracking-tight">{displayTitle}</h3>
        ) : (
          <h3 className="text-muted-foreground line-clamp-1 text-sm font-medium">未命名回忆</h3>
        )}

        {parsed.summary ? (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
            {parsed.summary}
          </p>
        ) : null}

        {metadataItems.length > 0 ? (
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {metadataItems.slice(0, 4).map((meta) => (
              <span
                key={`${meta.key}-${meta.value}`}
                title={`${meta.label}: ${meta.value}`}
                className="inline-flex max-w-full min-w-0 items-center gap-1"
              >
                <MemoryMetadataIcon icon={meta.icon} className="size-3 shrink-0 opacity-75" />
                <span className="truncate">
                  {meta.icon === 'hash' ? `${meta.label}: ${meta.value}` : meta.value}
                </span>
              </span>
            ))}
          </div>
        ) : null}

        {parsed.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {parsed.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-full px-2 py-0 text-[11px] font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="text-muted-foreground mt-auto flex items-center justify-between gap-2 pt-1 text-xs">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Clock3Icon className="size-3.5 shrink-0 opacity-75" />
            {displayDate}
          </span>
          <ArrowUpRightIcon className="size-3.5 shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  )
}
