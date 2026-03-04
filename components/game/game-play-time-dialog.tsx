'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  getGameTimerRecordsById,
  updateGameTimerRecordsById,
} from '@/lib/game-utils'

type GamePlayTimeDialogProps = {
  gameId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RecordFormItem = {
  id: string
  startAt: string
  endAt: string
}

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds))
  const hour = Math.floor(safe / 3600)
  const minute = Math.floor((safe % 3600) / 60)
  const second = safe % 60
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}:${second.toString().padStart(2, '0')}`
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleString('zh-CN')
}

const toDateInput = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (num: number) => String(num).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

const toTimeInput = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (num: number) => String(num).padStart(2, '0')
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  return `${hour}:${minute}`
}

const fromDateTimeInput = (dateValue: string, timeValue: string) => {
  if (!dateValue || !timeValue) {
    return ''
  }
  const date = new Date(`${dateValue}T${timeValue}`)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString()
}

const calcDurationSeconds = (startAt: string, endAt: string) => {
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
}

export default function GamePlayTimeDialog({
  gameId,
  open,
  onOpenChange,
}: GamePlayTimeDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [records, setRecords] = useState<RecordFormItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newStartDate, setNewStartDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newEndTime, setNewEndTime] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await getGameTimerRecordsById(gameId)
        setRecords(
          data.records.map((item) => ({
            id: String(item.id),
            startAt: item.startAt,
            endAt: item.endAt,
          })),
        )
      } catch (error) {
        const err = error as {
          response?: { data?: { error?: string } }
          message?: string
        }
        toast.error(
          err.response?.data?.error || err.message || '加载计时器失败',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [gameId, open])

  const totalSeconds = useMemo(
    () =>
      records.reduce(
        (sum, item) => sum + calcDurationSeconds(item.startAt, item.endAt),
        0,
      ),
    [records],
  )

  const handleAdd = () => {
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

    setRecords((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        startAt,
        endAt,
      },
    ])
    setNewStartDate('')
    setNewStartTime('')
    setNewEndDate('')
    setNewEndTime('')
  }

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id))
    if (editingId === id) {
      setEditingId(null)
    }
  }

  const handleRecordFieldChange = (
    id: string,
    key: 'startAt' | 'endAt',
    nextDate: string,
    nextTime: string,
  ) => {
    const nextIso = fromDateTimeInput(nextDate, nextTime)
    if (!nextIso) {
      return
    }
    setRecords((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: nextIso } : item)),
    )
  }

  const handleSave = async () => {
    const hasInvalid = records.some((item) => {
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
        records: records.map((item) => ({
          startAt: item.startAt,
          endAt: item.endAt,
        })),
      })
      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>游玩时间</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">添加计时器</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
                <Input
                  type="time"
                  step={60}
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
                <Input
                  type="time"
                  step={60}
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleAdd}>
                添加
              </Button>
            </div>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
            {isLoading ? (
              <div className="text-muted-foreground text-sm">加载中...</div>
            ) : records.length === 0 ? (
              <div className="text-muted-foreground text-sm">暂无计时器</div>
            ) : (
              records.map((item, index) => {
                const durationSeconds = calcDurationSeconds(
                  item.startAt,
                  item.endAt,
                )
                const isEditing = editingId === item.id

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1 text-sm">
                      {isEditing ? (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="date"
                              value={toDateInput(item.startAt)}
                              onChange={(e) =>
                                handleRecordFieldChange(
                                  item.id,
                                  'startAt',
                                  e.target.value,
                                  toTimeInput(item.startAt),
                                )
                              }
                            />
                            <Input
                              type="time"
                              step={60}
                              value={toTimeInput(item.startAt)}
                              onChange={(e) =>
                                handleRecordFieldChange(
                                  item.id,
                                  'startAt',
                                  toDateInput(item.startAt),
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="date"
                              value={toDateInput(item.endAt)}
                              onChange={(e) =>
                                handleRecordFieldChange(
                                  item.id,
                                  'endAt',
                                  e.target.value,
                                  toTimeInput(item.endAt),
                                )
                              }
                            />
                            <Input
                              type="time"
                              step={60}
                              value={toTimeInput(item.endAt)}
                              onChange={(e) =>
                                handleRecordFieldChange(
                                  item.id,
                                  'endAt',
                                  toDateInput(item.endAt),
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>开始：{formatDateTime(item.startAt)}</div>
                          <div>结束：{formatDateTime(item.endAt)}</div>
                        </>
                      )}
                      <div className="text-muted-foreground">
                        时长：{formatDuration(durationSeconds)}
                      </div>
                    </div>

                    <div className="w-8 shrink-0 text-center text-sm font-medium">
                      #{index + 1}
                    </div>

                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setEditingId((prev) =>
                            prev === item.id ? null : item.id,
                          )
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter className="flex w-full items-center justify-between sm:justify-between">
          <div className="text-sm">
            总游戏时长：{formatDuration(totalSeconds)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
