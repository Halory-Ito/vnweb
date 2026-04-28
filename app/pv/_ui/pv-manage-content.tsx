'use client'

import {
  ExternalLinkIcon,
  PencilIcon,
  PlayCircleIcon,
  PlayIcon,
  Trash2Icon,
} from 'lucide-react'

import { getHostname, getYouTubeCover, toDisplayDate } from './utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { PvItem, ViewMode } from './types'

type PvManageContentProps = {
  items: PvItem[]
  isLoading: boolean
  isRefetching: boolean
  viewMode: ViewMode
  onPlay: (item: PvItem) => void
  onEdit: (item: PvItem) => void
  onDelete: (item: PvItem) => void
}

export function PvManageContent({
  items,
  isLoading,
  isRefetching,
  viewMode,
  onPlay,
  onEdit,
  onDelete,
}: PvManageContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-muted-foreground flex items-center text-sm font-medium">
        <span className="bg-secondary text-secondary-foreground flex h-5 items-center rounded-full px-2.5 text-xs">
          {items.length} 记录
        </span>
        {isRefetching && (
          <span className="ml-2 animate-pulse text-xs opacity-70">
            Refreshing...
          </span>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="bg-background/50 overflow-hidden rounded-xl border shadow-sm backdrop-blur-xl">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="h-11 w-16 text-center font-medium">
                  ID
                </TableHead>
                <TableHead className="min-w-45 text-center font-medium">
                  游戏
                </TableHead>
                <TableHead className="min-w-40 text-center font-medium">
                  标题
                </TableHead>
                <TableHead className="min-w-[320px] text-center font-medium">
                  链接
                </TableHead>
                <TableHead className="min-w-45 text-center font-medium">
                  更新时间
                </TableHead>
                <TableHead className="w-36 text-center font-medium">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell>
                      <Skeleton className="mx-auto h-5 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="mx-auto h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="mx-auto h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="mx-auto h-5 w-64" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="mx-auto h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Skeleton className="h-8 w-16 rounded-lg" />
                        <Skeleton className="h-8 w-16 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-16 text-center text-sm"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    className="group border-border/50 transition-colors"
                  >
                    <TableCell className="text-muted-foreground text-center">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {item.gameNameCn || item.gameName}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground max-w-65 truncate text-center"
                      title={item.name}
                    >
                      {item.name}
                    </TableCell>
                    <TableCell className="max-w-105 text-center">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-primary inline-flex max-w-full items-center justify-center gap-1.5 truncate text-sm transition-colors hover:underline"
                        title={item.url}
                      >
                        <span className="truncate">{item.url}</span>
                        <ExternalLinkIcon className="size-3 shrink-0 opacity-50" />
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      {toDisplayDate(item.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:bg-secondary hover:text-foreground h-8 rounded-lg"
                          onClick={() => onEdit(item)}
                          title="编辑"
                        >
                          <PencilIcon className="size-4" />
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 rounded-lg"
                          onClick={() => onDelete(item)}
                          title="删除"
                        >
                          <Trash2Icon className="size-4" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-1">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <div className="px-1 py-1">
                <Skeleton className="mx-auto h-4 w-full" />
                <Skeleton className="mx-auto mt-2 h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground flex min-h-75 items-center justify-center text-sm">
          暂无数据
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const videoHost = getHostname(item.url)
            const coverUrl = getYouTubeCover(item.url)
            const fallbackCover = item.gameBg || item.gameCover || ''
            const previewCover = coverUrl || fallbackCover

            return (
              <div
                key={item.id}
                className="group relative flex flex-col p-1 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative w-full">
                  <div
                    className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-2xl"
                    onClick={() => onPlay(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onPlay(item)
                    }}
                  >
                    <div className="bg-primary/20 pointer-events-none absolute -inset-4 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60" />

                    {previewCover ? (
                      <img
                        src={previewCover}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="from-background to-muted flex h-full w-full items-center justify-center bg-linear-to-br">
                        <PlayCircleIcon className="text-muted-foreground/30 size-10 transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    )}

                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-t from-black/90 via-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="mb-5 size-14 rounded-full text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/25 hover:shadow-2xl"
                      >
                        <PlayIcon
                          className="ml-0.5 size-6"
                          fill="currentColor"
                        />
                      </Button>

                      <div className="absolute right-2 bottom-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white backdrop-blur-md">
                        {videoHost}
                      </div>
                    </div>

                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/20" />
                  </div>
                </div>

                <div className="mt-2.5 w-full px-1">
                  <h3
                    className="group-hover:text-primary truncate text-center text-sm leading-tight font-medium tracking-wide transition-colors"
                    title={item.name}
                  >
                    {item.name}
                  </h3>
                  <p
                    className="text-muted-foreground mt-1 truncate text-center text-[11px]"
                    title={item.gameNameCn || item.gameName}
                  >
                    {item.gameNameCn || item.gameName}
                  </p>
                </div>

                <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 rounded-full shadow-md backdrop-blur-sm hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(item)
                    }}
                    title="编辑"
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="size-7 rounded-full shadow-md backdrop-blur-sm hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(item)
                    }}
                    title="删除"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
