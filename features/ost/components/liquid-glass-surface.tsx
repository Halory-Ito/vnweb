'use client'

import { useLiquidGlassPointer } from '../hooks/use-liquid-glass-pointer'
import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

type LiquidGlassSurfaceProps = {
  children: ReactNode
  cover?: string
  isPlaying?: boolean
  interactive?: boolean
  className?: string
  contentClassName?: string
}

export function LiquidGlassSurface({
  children,
  cover,
  isPlaying = false,
  interactive = true,
  className,
  contentClassName,
}: LiquidGlassSurfaceProps) {
  const pointer = useLiquidGlassPointer(interactive)

  return (
    <div {...pointer} className={cn('ost-liquid-glass', className)}>
      {cover ? (
        <img
          src={cover}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 size-full scale-150 object-cover opacity-[0.14] blur-2xl saturate-[2.2] dark:opacity-[0.22]"
        />
      ) : null}
      <div aria-hidden="true" className="ost-liquid-glass-glint" />
      {isPlaying ? <div aria-hidden="true" className="ost-liquid-sheen-sweep" /> : null}
      <div className={cn('relative z-[2]', contentClassName)}>{children}</div>
    </div>
  )
}
