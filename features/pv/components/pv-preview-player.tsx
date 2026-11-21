import { ExternalLinkIcon, Loader2Icon, PlayIcon } from 'lucide-react'
import { useState } from 'react'

import { getPlayableUrl, usePvPlayback, usePvVideo } from '../hooks/use-pv-playback'
import { PvCover } from './pv-cover'
import { Button } from '@/components/ui/button'

import type { PvItem } from '../types'

function PvVideo({
  url,
  autoPlay,
  onDuration,
}: {
  url: string
  autoPlay: boolean
  onDuration?: (duration: number) => void
}) {
  const { setVideo, hasError, onError } = usePvVideo(url)

  return hasError ? (
    <p className="m-auto p-4 text-center text-sm">播放失败，请打开原始链接。</p>
  ) : (
    <video
      ref={setVideo}
      controls
      autoPlay={autoPlay}
      playsInline
      preload="metadata"
      onError={onError}
      onLoadedMetadata={(event) => {
        const duration = event.currentTarget.duration
        if (Number.isFinite(duration) && duration > 0) onDuration?.(Math.round(duration))
      }}
      className="size-full bg-black object-contain"
    />
  )
}

export function PvPlayback({
  item,
  autoPlay = false,
  onDuration,
}: {
  item: Pick<PvItem, 'url' | 'name'>
  autoPlay?: boolean
  onDuration?: (duration: number) => void
}) {
  const source = usePvPlayback(item.url)
  if (source.mode === 'loading')
    return <Loader2Icon aria-label="正在解析视频" className="m-auto size-6 animate-spin" />
  if (source.mode === 'unavailable')
    return <p className="m-auto p-4 text-center text-sm">当前链接无法站内播放，请打开原始链接。</p>
  if (source.mode === 'direct')
    return <PvVideo key={source.url} url={source.url} autoPlay={autoPlay} onDuration={onDuration} />

  return (
    <iframe
      src={source.url}
      title={item.name}
      className="size-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}

export function PvPreviewPlayer({
  item,
  onDuration,
}: {
  item: PvItem
  onDuration: (duration: number) => void
}) {
  const [playing, setPlaying] = useState(false)
  const link = getPlayableUrl(item.url)
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="bg-muted relative grid aspect-video overflow-hidden rounded-xl border">
        {playing ? (
          <PvPlayback item={item} autoPlay onDuration={onDuration} />
        ) : (
          <>
            <PvCover item={item} className="absolute inset-0 size-full" />
            <Button
              type="button"
              onClick={() => setPlaying(true)}
              className="z-10 m-auto rounded-full"
            >
              <PlayIcon />
              播放预览
            </Button>
          </>
        )}
      </div>
      {link && (
        <Button variant="outline" size="sm" asChild className="self-start">
          <a href={link} target="_blank" rel="noreferrer">
            <ExternalLinkIcon />
            打开原始链接
          </a>
        </Button>
      )}
    </div>
  )
}
