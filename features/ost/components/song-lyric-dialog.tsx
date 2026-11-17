'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { OstSongItem } from '@/types'

type SongLyricDialogProps = {
  item: OstSongItem | null
  onOpenChange: (open: boolean) => void
}

export function SongLyricDialog({ item, onOpenChange }: SongLyricDialogProps) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">{item?.name || '歌词预览'}</DialogTitle>
          <DialogDescription>
            {item?.lyricsPath && !item?.lyricsText ? '歌词文件' : '歌曲歌词文本'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-80 rounded-xl border p-4">
          {item?.lyricsText ? (
            <pre className="font-sans text-sm leading-relaxed break-words whitespace-pre-wrap">
              {item.lyricsText}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm">
              {item?.lyricsPath && /^https?:\/\//i.test(item.lyricsPath) ? (
                <a
                  href={item.lyricsPath}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  打开在线歌词
                </a>
              ) : (
                <>当前仅关联了本地歌词文件路径：{item?.lyricsPath || '无'}</>
              )}
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
