'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  formatDateInput,
  formatDateTimeDisplay,
  formatTimeInput,
  parseDateInput,
  parseTimeParts,
} from '../lib/play-time-format'

type UsePlayTimeDateTimePickerParams = {
  dateValue: string
  timeValue: string
  onChange: (nextDate: string, nextTime: string) => void
}

/** Manages popover state, calendar month navigation, and date/time synchronization. */
export function usePlayTimeDateTimePicker({
  dateValue,
  timeValue,
  onChange,
}: UsePlayTimeDateTimePickerParams) {
  const [open, setOpen] = useState(false)
  const [displayMonth, setDisplayMonth] = useState<Date>(
    () => parseDateInput(dateValue) ?? new Date(),
  )

  const selectedDate = useMemo(() => parseDateInput(dateValue), [dateValue])
  const timeParts = useMemo(() => parseTimeParts(timeValue), [timeValue])
  const displayText = useMemo(
    () => formatDateTimeDisplay(dateValue, timeValue),
    [dateValue, timeValue],
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) {
        setDisplayMonth(selectedDate ?? new Date())
      }
    },
    [selectedDate],
  )

  const handleDateSelect = useCallback(
    (nextDay: Date | undefined) => {
      if (!nextDay) {
        return
      }
      const nextDate = formatDateInput(nextDay)
      const nextTime = timeParts ? timeValue : formatTimeInput(new Date())
      setDisplayMonth(nextDay)
      onChange(nextDate, nextTime)
    },
    [onChange, timeParts, timeValue],
  )

  const handleHourSelect = useCallback(
    (hour: string) => {
      const nextDate = selectedDate ? dateValue : formatDateInput(new Date())
      const nextMinute = timeParts?.minute ?? '00'
      onChange(nextDate, `${hour}:${nextMinute}`)
    },
    [dateValue, onChange, selectedDate, timeParts?.minute],
  )

  const handleMinuteSelect = useCallback(
    (minute: string) => {
      const nextDate = selectedDate ? dateValue : formatDateInput(new Date())
      const nextHour = timeParts?.hour ?? String(new Date().getHours()).padStart(2, '0')
      onChange(nextDate, `${nextHour}:${minute}`)
    },
    [dateValue, onChange, selectedDate, timeParts?.hour],
  )

  const handleSetNow = useCallback(() => {
    const now = new Date()
    setDisplayMonth(now)
    onChange(formatDateInput(now), formatTimeInput(now))
  }, [onChange])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  return {
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
  }
}
