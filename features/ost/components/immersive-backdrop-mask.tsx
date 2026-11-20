'use client'

import type { CSSProperties } from 'react'

type ImmersiveBackdropMaskProps = {
  imageUrl?: string
  isPlaying: boolean
}

const BACKDROP_MASK_STYLE: CSSProperties = {
  maskImage:
    'radial-gradient(ellipse 82% 76% at 50% 46%, black 40%, rgba(0, 0, 0, 0.68) 68%, transparent 98%)',
  WebkitMaskImage:
    'radial-gradient(ellipse 82% 76% at 50% 46%, black 40%, rgba(0, 0, 0, 0.68) 68%, transparent 98%)',
}

export function ImmersiveBackdropMask({ imageUrl, isPlaying }: ImmersiveBackdropMaskProps) {
  const playState = isPlaying ? 'running' : 'paused'

  if (!imageUrl) {
    return (
      <div
        aria-hidden="true"
        className="from-primary/15 via-background to-muted/40 pointer-events-none fixed inset-0 z-0 bg-gradient-to-br"
      />
    )
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="size-full" style={BACKDROP_MASK_STYLE}>
        <img
          src={imageUrl}
          alt=""
          style={{ animationPlayState: playState }}
          className="ost-backdrop-kenburns size-full object-cover opacity-85 dark:opacity-75"
        />
        <div
          style={{ animationPlayState: playState }}
          className="ost-backdrop-sheen via-white/15 dark:via-white/10 pointer-events-none absolute -inset-1/3 bg-gradient-to-r from-transparent to-transparent blur-2xl"
        />
      </div>
      <div className="from-background/85 via-background/20 to-background/60 absolute inset-0 bg-gradient-to-t" />
    </div>
  )
}
