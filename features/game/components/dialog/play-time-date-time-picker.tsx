'use client'

import { CalendarIcon, ChevronDownIcon } from 'lucide-react'
import { memo } from 'react'
import { zhCN } from 'react-day-picker/locale'

import { usePlayTimeDateTimePicker } from '../../hooks/use-play-time-date-time-picker'
import { PlayTimeClockColumns } from './play-time-clock-columns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const CALENDAR_START_MONTH = new Date(1990, 0)
const CALENDAR_END_MONTH = new Date(new Date().getFullYear() + 1, 11)
const CALENDAR_FORMATTERS = {
  formatMonthDropdown: (date: Date) => `${date.getMonth() + 1}月`,
  formatYearDropdown: (date: Date) => `${date.getFullYear()}年`,
}

type PlayTimeDateTimePickerProps = {
  id?: string
  ariaLabel: string
  placeholder?: string
  dateValue: string
  timeValue: string
  onChange: (nextDate: string, nextTime: string) => void
  disabled?: boolean
  className?: string
}

/** Outlined shadcn DateTime picker combining a localized Calendar and 24-hour clock columns. */
export const PlayTimeDateTimePicker = memo(function PlayTimeDateTimePicker({
  id,
  ariaLabel,
  placeholder = '选择日期与时间',
  dateValue,
  timeValue,
  onChange,
  disabled,
  className,
}: PlayTimeDateTimePickerProps) {
  const {
    open,
    displayMonth,
    setDisplayMonth,
    selectedDate,
    timeParts,
    displayText,
    handleOpenChange,
    handleDateSelect,
    handleHourSelect,
    handleMinuteSelect,
    handleSetNow,
    handleClose,
  } = usePlayTimeDateTimePicker({ dateValue, timeValue, onChange })

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn('w-full justify-between px-3 font-normal tabular-nums', className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
            <span className={cn('truncate', !displayText && 'text-muted-foreground')}>
              {displayText || placeholder}
            </span>
          </span>
          <ChevronDownIcon className="text-muted-foreground size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <div className="flex flex-col sm:flex-row">
          <Calendar
            mode="single"
            locale={zhCN}
            captionLayout="dropdown"
            startMonth={CALENDAR_START_MONTH}
            endMonth={CALENDAR_END_MONTH}
            selected={selectedDate}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            onSelect={handleDateSelect}
            formatters={CALENDAR_FORMATTERS}
          />
          <PlayTimeClockColumns
            open={open}
            selectedHour={timeParts?.hour}
            selectedMinute={timeParts?.minute}
            onHourSelect={handleHourSelect}
            onMinuteSelect={handleMinuteSelect}
          />
        </div>
        <div className="flex items-center justify-between border-t px-3 py-2">
          <Button type="button" variant="ghost" size="xs" onClick={handleSetNow}>
            此刻
          </Button>
          <Button type="button" variant="outline" size="xs" onClick={handleClose}>
            完成
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
})
