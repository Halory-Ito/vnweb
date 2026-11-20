'use client'

import { Check, Droplets, Layers2 } from 'lucide-react'
import { useState } from 'react'

import {
  getPlayerForm,
  PLAYER_FORMS,
  resolvePlayerFormId,
  type PlayerFormId,
} from '../lib/player-forms'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type PlayerFormPickerProps = {
  form: PlayerFormId
  onChange: (form: PlayerFormId) => void
  variant?: 'icon' | 'pill'
  side?: 'top' | 'bottom'
  align?: 'start' | 'end'
  onOpenChange?: (open: boolean) => void
}

export function PlayerFormPicker({
  form,
  onChange,
  variant = 'icon',
  side = 'top',
  align = 'end',
  onOpenChange,
}: PlayerFormPickerProps) {
  const [open, setOpen] = useState(false)
  const resolved = resolvePlayerFormId(form)
  const current = getPlayerForm(resolved)
  const isLiquid = resolved === 'liquid-glass'
  const TriggerIcon = isLiquid ? Droplets : Layers2

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {variant === 'pill' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-no-drag="true"
            aria-label="切换播放器形态"
            title={`形态：${current.label}`}
            className={cn(
              'h-7.5 gap-1.5 rounded-full px-2.5 text-xs font-normal',
              isLiquid
                ? 'ost-liquid-pill text-foreground hover:brightness-105 dark:text-white'
                : 'bg-background/60 hover:bg-background/80 border backdrop-blur-xs',
            )}
          >
            <TriggerIcon
              className={cn(
                'size-3.5',
                isLiquid ? 'text-sky-600 dark:text-sky-300' : 'text-primary',
              )}
            />
            <span className="hidden sm:inline">{current.label}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            data-no-drag="true"
            aria-label="切换播放器形态"
            title={`形态：${current.label}`}
            className={cn(
              'rounded-full',
              isLiquid
                ? 'text-foreground/75 hover:bg-foreground/10 hover:text-foreground dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <TriggerIcon className="size-3.5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={10}
        className={cn(
          'z-[60] w-60 rounded-2xl p-1.5',
          isLiquid
            ? 'ost-liquid-glass text-foreground border-0'
            : 'bg-popover/90 shadow-xl backdrop-blur-2xl',
        )}
      >
        <div role="radiogroup" aria-label="播放器形态" className="relative z-[2] space-y-0.5">
          {PLAYER_FORMS.map((item) => {
            const selected = item.id === resolved
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  onChange(item.id)
                  handleOpenChange(false)
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors',
                  selected
                    ? isLiquid
                      ? 'bg-foreground/10 text-foreground dark:bg-white/18 dark:text-white'
                      : 'bg-primary/10 text-primary'
                    : isLiquid
                      ? 'text-foreground/85 hover:bg-foreground/6 dark:text-white/85 dark:hover:bg-white/10'
                      : 'text-foreground hover:bg-accent/60',
                )}
              >
                {item.id === 'liquid-glass' ? (
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/85 bg-gradient-to-br from-sky-200/85 via-white/90 to-indigo-200/80 text-sky-700 shadow-xs dark:border-white/30 dark:from-sky-400/35 dark:via-white/20 dark:to-indigo-400/30 dark:text-sky-100"
                  >
                    <Droplets className="size-3.5" />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="bg-muted/80 border-border/60 flex size-6 shrink-0 items-center justify-center rounded-full border"
                  >
                    <Layers2 className="size-3.5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{item.label}</p>
                  <p className="text-muted-foreground truncate text-[11px]">{item.subtitle}</p>
                </div>
                {selected ? <Check className="size-3.5 shrink-0" /> : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
