'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  calcDurationSeconds,
  fromDateTimeInput,
  removeRecordsBelowDuration,
  sortPlayTimeRecordsDesc,
  type PlayTimeRecordFormItem,
} from '../lib/play-time-format'
import { getGameTimerRecordsById, updateGameTimerRecordsById } from '@/api'

export function useGamePlayTimeDialog({
  gameId,
  open,
  onOpenChange,
}: {
  gameId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [records, setRecords] = useState<PlayTimeRecordFormItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newStartDate, setNewStartDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newEndTime, setNewEndTime] = useState('')

  useEffect(() => {
    if (!open) {
      setEditingId(null)
      return
    }

    let cancelled = false
    setEditingId(null)

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await getGameTimerRecordsById(gameId)
        if (cancelled) return
        setRecords(
          sortPlayTimeRecordsDesc(
            data.records.map((item) => ({
              id: String(item.id),
              startAt: item.startAt,
              endAt: item.endAt,
            })),
          ),
        )
      } catch (error) {
        if (cancelled) return
        const err = error as {
          response?: { data?: { error?: string } }
          message?: string
        }
        toast.error(err.response?.data?.error || err.message || '加载计时器失败')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void fetchData()
    return () => {
      cancelled = true
    }
  }, [gameId, open])

  const totalSeconds = useMemo(
    () => records.reduce((sum, item) => sum + calcDurationSeconds(item.startAt, item.endAt), 0),
    [records],
  )

  const handleAdd = useCallback(() => {
    const startAt = fromDateTimeInput(newStartDate, newStartTime)
    const endAt = fromDateTimeInput(newEndDate, newEndTime)

    if (!startAt || !endAt) {
      toast.error('请填写有效的开始和结束时间')
      return
    }

    if (new Date(endAt).getTime() < new Date(startAt).getTime()) {
      toast.error('结束时间不能早于开始时间')
      return
    }

    setRecords((prev) =>
      sortPlayTimeRecordsDesc([
        ...prev,
        {
          id: `new-${Date.now()}`,
          startAt,
          endAt,
        },
      ]),
    )
    setNewStartDate('')
    setNewStartTime('')
    setNewEndDate('')
    setNewEndTime('')
  }, [newStartDate, newStartTime, newEndDate, newEndTime])

  const handleDelete = useCallback((id: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id))
    setEditingId((prev) => (prev === id ? null : prev))
  }, [])

  const handleBatchDeleteBelowDuration = useCallback(
    (thresholdSeconds: number) => {
      const { remaining, removedCount } = removeRecordsBelowDuration(records, thresholdSeconds)
      if (removedCount === 0) {
        toast.info('没有低于指定时长的计时器')
        return
      }
      setRecords(remaining)
      const remainingIds = new Set(remaining.map((item) => item.id))
      setEditingId((prev) => (prev && remainingIds.has(prev) ? prev : null))
      toast.success(`已删除 ${removedCount} 条计时器`)
    },
    [records],
  )

  const handleToggleEdit = useCallback(
    (id: string) => {
      if (editingId !== null) {
        setRecords((prev) => sortPlayTimeRecordsDesc(prev))
      }
      setEditingId((prev) => (prev === id ? null : id))
    },
    [editingId],
  )

  const handleRecordFieldChange = useCallback(
    (id: string, key: 'startAt' | 'endAt', nextDate: string, nextTime: string) => {
      const nextIso = fromDateTimeInput(nextDate, nextTime)
      if (!nextIso) {
        return
      }
      setRecords((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [key]: nextIso } : item)),
      )
    },
    [],
  )

  const handleSave = useCallback(async () => {
    const sortedRecords = sortPlayTimeRecordsDesc(records)
    const hasInvalid = sortedRecords.some((item) => {
      const start = new Date(item.startAt)
      const end = new Date(item.endAt)
      return (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end.getTime() < start.getTime()
      )
    })

    if (hasInvalid) {
      toast.error('请先修正计时器列表中的无效时间')
      return
    }

    setIsSaving(true)
    try {
      await updateGameTimerRecordsById(gameId, {
        records: sortedRecords.map((item) => ({
          startAt: item.startAt,
          endAt: item.endAt,
        })),
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['game', String(gameId)] }),
        queryClient.invalidateQueries({ queryKey: ['game'] }),
        queryClient.invalidateQueries({ queryKey: ['game-records', gameId] }),
        queryClient.invalidateQueries({ queryKey: ['game-cards'] }),
        queryClient.invalidateQueries({ queryKey: ['collections'] }),
      ])
      router.refresh()
      toast.success('游玩时间已保存')
      onOpenChange(false)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [gameId, onOpenChange, queryClient, records, router])

  const handleNewStartChange = useCallback((nextDate: string, nextTime: string) => {
    setNewStartDate(nextDate)
    setNewStartTime(nextTime)
  }, [])

  const handleNewEndChange = useCallback((nextDate: string, nextTime: string) => {
    setNewEndDate(nextDate)
    setNewEndTime(nextTime)
  }, [])

  return {
    isLoading,
    isSaving,
    records,
    editingId,
    totalSeconds,
    newStartDate,
    newStartTime,
    newEndDate,
    newEndTime,
    handleNewStartChange,
    handleNewEndChange,
    handleAdd,
    handleDelete,
    handleBatchDeleteBelowDuration,
    handleToggleEdit,
    handleRecordFieldChange,
    handleSave,
  }
}
