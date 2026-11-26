'use client'

import { memo, useEffect, useRef } from 'react'

import { HOUR_OPTIONS, MINUTE_OPTIONS } from '../../lib/play-time-format'
import { Button } from '@/components/ui/button'

type PlayTimeClockColumnsProps = {
  open: boolean
  selectedHour?: string
  selectedMinute?: string
  onHourSelect: (hour: string) => void
  onMinuteSelect: (minute: string) => void
}

/** Scrollable 24-hour and minute selector columns for the DateTime picker. */
export const PlayTimeClockColumns = memo(function PlayTimeClockColumns({
  open,
  selectedHour,
  selectedMinute,
  onHourSelect,
  onMinuteSelect,
}: PlayTimeClockColumnsProps) {
  const hourListRef = useRef<HTMLDivElement>(null)
  const minuteListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const frameId = requestAnimationFrame(() => {
      hourListRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({
        block: 'center',
      })
      minuteListRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({
        block: 'center',
      })
    })
    return () => cancelAnimationFrame(frameId)
  }, [open])

  const columns = [
    {
      title: '时',
      ref: hourListRef,
      options: HOUR_OPTIONS,
      selected: selectedHour,
      onSelect: onHourSelect,
    },
    {
      title: '分',
      ref: minuteListRef,
      options: MINUTE_OPTIONS,
      selected: selectedMinute,
      onSelect: onMinuteSelect,
    },
  ]

  return (
    <div className="grid grid-cols-2 divide-x border-t sm:border-t-0 sm:border-l">
      {columns.map((column) => (
        <div key={column.title} className="flex flex-col">
          <div className="text-muted-foreground border-b py-2 text-center text-xs font-medium">
            {column.title}
          </div>
          <div
            ref={column.ref}
            className="h-40 space-y-1 overflow-y-auto p-1.5 sm:h-[264px] sm:w-16"
          >
            {column.options.map((value) => {
              const active = column.selected === value
              return (
                <Button
                  key={value}
                  type="button"
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  data-active={active ? 'true' : undefined}
                  className="h-7 w-full px-0 tabular-nums"
                  onClick={() => column.onSelect(value)}
                >
                  {value}
                </Button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
})
