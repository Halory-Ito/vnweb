'use client'

import { ExternalLinkIcon } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import type { PvItem, PvPlayerMode } from './types'

type PvPlayerDialogProps = {
  item: PvItem | null
  mode: PvPlayerMode
  embedUrl: string
  videoRef: React.Ref<HTMLVideoElement>
  onOpenChange: (open: boolean) => void
  onVideoError: () => void
}

export function PvPlayerDialog({
  item,
  mode,
  embedUrl,
  videoRef,
  onOpenChange,
  onVideoError,
}: PvPlayerDialogProps) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-5xl">
        <DialogHeader>
          <DialogTitle>{item?.name || '播放 PV'}</DialogTitle>
        </DialogHeader>

        {mode === 'direct' ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <video
              ref={videoRef}
              key={item?.id ?? 'pv-player'}
              controls
              autoPlay
              preload="auto"
              onError={onVideoError}
              poster={item ? item.gameBg || item.gameCover || undefined : undefined}
              className="h-full w-full"
            >
              您的浏览器不支持 HTML5 视频播放。
            </video>
          </div>
        ) : null}

        {mode === 'embed' ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
            <iframe
              title={item?.name || 'PV 播放'}
              src={embedUrl}
              className="h-full w-full"
              frameBorder="0"
              scrolling="no"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}

        {mode === 'none' && item ? (
          <div className="text-muted-foreground space-y-2 rounded-lg border p-4 text-sm">
            <div>当前链接暂不支持站内播放，请在新窗口打开观看。</div>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1 hover:underline"
            >
              打开原始链接
              <ExternalLinkIcon className="size-3" />
            </a>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
