import { FilmIcon } from 'lucide-react'

import { getYouTubeCover } from '../lib/pv-utils'
import { cn } from '@/lib/utils'

import type { PvItem } from '../types'

export function PvCover({ item, className }: { item: PvItem; className?: string }) {
  const cover = getYouTubeCover(item.url) || item.gameBg || item.gameCover

  return (
    <div
      className={cn(
        'bg-muted text-muted-foreground relative grid aspect-video place-items-center overflow-hidden',
        className,
      )}
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <FilmIcon aria-hidden="true" className="size-7" />
      )}
    </div>
  )
}
