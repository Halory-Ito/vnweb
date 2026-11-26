'use client'

import { ExternalLinkIcon, RotateCwIcon } from 'lucide-react'

import { useSongLyricPreview } from '../hooks/use-song-lyric-preview'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

import type { OstSongItem } from '@/types'

type SongLyricDialogProps = {
  item: OstSongItem | null
  onOpenChange: (open: boolean) => void
}

export function SongLyricDialog({ item, onOpenChange }: SongLyricDialogProps) {
  const lyric = useSongLyricPreview(item)

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">{item?.name || '歌词预览'}</DialogTitle>
          <DialogDescription>
            {lyric.isRemote
              ? '在线歌词'
              : lyric.path && !lyric.content
                ? '本地歌词文件'
                : '歌曲歌词文本'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="bg-muted/30 max-h-96 rounded-xl p-4">
          {lyric.isLoading ? (
            <div className="space-y-2.5 py-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : lyric.isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <p className="text-muted-foreground text-sm">在线歌词加载失败</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={lyric.isFetching}
                  onClick={lyric.refetch}
                >
                  <RotateCwIcon className="size-3.5" />
                  {lyric.isFetching ? '重试中...' : '重新加载'}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={lyric.path} target="_blank" rel="noreferrer">
                    <ExternalLinkIcon className="size-3.5" />
                    打开原链接
                  </a>
                </Button>
              </div>
            </div>
          ) : lyric.content ? (
            <pre className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {lyric.content}
            </pre>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {!lyric.isRemote && lyric.path
                ? `当前仅关联了本地歌词文件路径：${lyric.path}`
                : '暂无歌词内容'}
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
