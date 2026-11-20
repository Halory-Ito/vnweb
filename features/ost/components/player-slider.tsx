'use client'

import { Slider as SliderPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

import type { PlayerFormId } from '../lib/player-forms'
import type * as React from 'react'

type PlayerSliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  form?: PlayerFormId
  trackClassName?: string
  rangeClassName?: string
  thumbClassName?: string
}

export function PlayerSlider({
  form = 'classic',
  className,
  trackClassName,
  rangeClassName,
  thumbClassName,
  ...props
}: PlayerSliderProps) {
  const isLiquid = form === 'liquid-glass'

  return (
    <SliderPrimitive.Root
      className={cn(
        'group/slider relative flex w-full cursor-pointer touch-none items-center py-2 select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          'relative w-full grow overflow-hidden rounded-full transition-[height] duration-150',
          isLiquid
            ? 'bg-foreground/12 h-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.14)] group-hover/slider:h-2 dark:bg-white/15 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.38)]'
            : 'bg-foreground/15 h-1 group-hover/slider:h-1.5',
          trackClassName,
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            'absolute h-full rounded-full transition-colors duration-150',
            isLiquid
              ? 'via-foreground/90 to-foreground group-hover/slider:to-primary bg-gradient-to-r from-sky-500/85 group-hover/slider:from-sky-500 dark:from-sky-300/85 dark:via-white/95 dark:to-white dark:shadow-[0_0_8px_rgba(186,230,253,0.45)]'
              : 'bg-foreground group-hover/slider:bg-primary',
            rangeClassName,
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          'block size-3 shrink-0 rounded-full transition-all duration-150 focus-visible:scale-110 focus-visible:opacity-100 focus-visible:ring-4 focus-visible:outline-hidden sm:scale-75 sm:opacity-0 sm:group-hover/slider:scale-100 sm:group-hover/slider:opacity-100',
          isLiquid
            ? 'border border-white/90 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.28)] ring-sky-400/35 dark:border-white/75 dark:shadow-[0_2px_10px_rgba(147,197,253,0.45)]'
            : 'bg-foreground ring-primary/30 shadow-sm',
          thumbClassName,
        )}
      />
    </SliderPrimitive.Root>
  )
}
