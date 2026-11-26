'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  countRecordsBelowDuration,
  formatDurationThresholdLabel,
  parseDurationThresholdSeconds,
  type PlayTimeDurationUnit,
  type PlayTimeRecordFormItem,
} from '../lib/play-time-format'

type UsePlayTimeBatchDeleteParams = {
  records: readonly PlayTimeRecordFormItem[]
  onConfirm: (thresholdSeconds: number) => void
}

/** Manages duration-threshold batch deletion state for play-time records. */
export function usePlayTimeBatchDelete({ records, onConfirm }: UsePlayTimeBatchDeleteParams) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [thresholdInput, setThresholdInput] = useState('1')
  const [unit, setUnit] = useState<PlayTimeDurationUnit>('minutes')

  const thresholdSeconds = useMemo(
    () => parseDurationThresholdSeconds(thresholdInput, unit),
    [thresholdInput, unit],
  )
  const thresholdLabel = useMemo(
    () => formatDurationThresholdLabel(thresholdInput, unit),
    [thresholdInput, unit],
  )
  const matchedCount = useMemo(
    () => countRecordsBelowDuration(records, thresholdSeconds),
    [records, thresholdSeconds],
  )

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const handleRequestConfirm = useCallback(() => {
    if (thresholdSeconds === null || matchedCount === 0) {
      return
    }
    setOpen(false)
    setConfirmOpen(true)
  }, [matchedCount, thresholdSeconds])

  const handleConfirmDelete = useCallback(() => {
    if (thresholdSeconds !== null && matchedCount > 0) {
      onConfirm(thresholdSeconds)
    }
    setConfirmOpen(false)
  }, [matchedCount, onConfirm, thresholdSeconds])

  return {
    open,
    confirmOpen,
    setConfirmOpen,
    thresholdInput,
    setThresholdInput,
    unit,
    setUnit,
    thresholdLabel,
    matchedCount,
    handleOpenChange,
    handleClose,
    handleRequestConfirm,
    handleConfirmDelete,
  }
}
