'use client'

import { Check, ImageIcon, Palette } from 'lucide-react'
import { useState } from 'react'

import {
  getImmersiveTheme,
  IMMERSIVE_THEMES,
  resolveImmersiveThemeId,
  type ImmersiveThemeId,
} from '../lib/immersive-themes'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type ImmersiveThemePickerProps = {
  theme: ImmersiveThemeId
  onChange: (id: ImmersiveThemeId) => void
  onOpenChange?: (open: boolean) => void
}

export function ImmersiveThemePicker({ theme, onChange, onOpenChange }: ImmersiveThemePickerProps) {
  const [open, setOpen] = useState(false)
  const resolvedTheme = resolveImmersiveThemeId(theme)
  const current = getImmersiveTheme(resolvedTheme)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="切换视觉效果"
          className="h-8 gap-1.5 rounded-full px-2.5 text-xs"
        >
          <Palette className="size-3.5" />
          <span>{current.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={10}
        className="bg-popover/90 z-[60] w-64 rounded-2xl p-1.5 shadow-xl backdrop-blur-2xl"
      >
        <div role="radiogroup" aria-label="沉浸式视觉效果" className="space-y-0.5">
          {IMMERSIVE_THEMES.map((item) => {
            const selected = item.id === resolvedTheme
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
                  selected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent/60',
                )}
              >
                {item.id === 'backdrop' ? (
                  <span className="bg-muted/80 border-border/60 flex size-6 shrink-0 items-center justify-center rounded-full border">
                    <ImageIcon className="size-3.5" />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="border-foreground/15 size-6 shrink-0 rounded-full border shadow-xs"
                    style={{
                      background: `linear-gradient(135deg, ${item.palette[0]}, ${item.palette[1]}, ${item.palette[2]})`,
                    }}
                  />
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
