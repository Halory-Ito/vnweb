'use client'

import { Loader2Icon } from 'lucide-react'

import { EmptyArtwork } from '@/components/ui/empty-artwork'
import { Skeleton } from '@/components/ui/skeleton'
import { SongTrackRow } from '@/features/ost/components/song-track-row'

import type { OstSongItem } from '@/types'

type SongManageContentProps = {
  items: OstSongItem[]
  isLoading: boolean
  isRefetching: boolean
  playingSongId: number | null
  isPlaying: boolean
  isBuffering: boolean
  onPlay: (item: OstSongItem) => void
  onEdit: (item: OstSongItem) => void
  onDelete: (item: OstSongItem) => void
  onPreviewLyric: (item: OstSongItem) => void
}

export function SongManageContent({
  items,
  isLoading,
  isRefetching,
  playingSongId,
  isPlaying,
  isBuffering,
  onPlay,
  onEdit,
  onDelete,
  onPreviewLyric,
}: SongManageContentProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-2 rounded-2xl border-2 p-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-13 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
        <EmptyArtwork className="mb-3" />
        <p className="text-sm font-medium">这张唱片里还没有收录曲目</p>
        <p className="text-muted-foreground mt-1 text-xs">
          点击右上角“添加歌曲”，把专辑里的音轨收录进来吧
        </p>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border-2 p-3 sm:p-4">
      {isRefetching ? (
        <div className="bg-background/85 absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-xs backdrop-blur-xs">
          <Loader2Icon className="size-3 animate-spin" />
          更新中
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <SongTrackRow
            key={item.id}
            index={index}
            item={item}
            isActive={playingSongId === item.id}
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            onPlay={onPlay}
            onEdit={onEdit}
            onDelete={onDelete}
            onPreviewLyric={onPreviewLyric}
          />
        ))}
      </div>
    </div>
  )
}
