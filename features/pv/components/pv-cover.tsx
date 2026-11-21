import { FilmIcon } from 'lucide-react'

import { getYouTubeCover } from '../lib/pv-utils'
import { cn } from '@/lib/utils'

import type { PvItem } from '../types'

export function PvCover({
  item,
  className,
  zoomOnGroupHover = false,
}: {
  item: PvItem
  className?: string
  zoomOnGroupHover?: boolean
}) {
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
          className={cn(
            'absolute inset-0 size-full object-cover',
            zoomOnGroupHover &&
              'transition-[scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045] motion-reduce:transition-none motion-reduce:group-hover:scale-100',
          )}
        />
      ) : (
        <FilmIcon aria-hidden="true" className="size-7" />
      )}
    </div>
  )
}
