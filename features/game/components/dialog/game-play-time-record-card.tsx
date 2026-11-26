'use client'

import { Check, Pencil, Trash2 } from 'lucide-react'
import { memo, useCallback } from 'react'

import {
  calcDurationSeconds,
  formatDateTime,
  formatDuration,
  toDateInput,
  toTimeInput,
  type PlayTimeRecordFormItem,
} from '../../lib/play-time-format'
import { PlayTimeDateTimePicker } from './play-time-date-time-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type GamePlayTimeRecordCardProps = {
  item: PlayTimeRecordFormItem
  index: number
  isEditing: boolean
  onToggleEdit: (id: string) => void
  onDelete: (id: string) => void
  onFieldChange: (id: string, key: 'startAt' | 'endAt', nextDate: string, nextTime: string) => void
}

export const GamePlayTimeRecordCard = memo(function GamePlayTimeRecordCard({
  item,
  index,
  isEditing,
  onToggleEdit,
  onDelete,
  onFieldChange,
}: GamePlayTimeRecordCardProps) {
  const durationSeconds = calcDurationSeconds(item.startAt, item.endAt)

  const handleStartChange = useCallback(
    (nextDate: string, nextTime: string) => {
      onFieldChange(item.id, 'startAt', nextDate, nextTime)
    },
    [item.id, onFieldChange],
  )

  const handleEndChange = useCallback(
    (nextDate: string, nextTime: string) => {
      onFieldChange(item.id, 'endAt', nextDate, nextTime)
    },
    [item.id, onFieldChange],
  )

  const fields = [
    {
      key: 'startAt' as const,
      id: `play-time-record-start-${item.id}`,
      label: '开始时间',
      ariaLabel: `编辑第 ${index + 1} 条记录的开始时间`,
      placeholder: '选择开始时间',
      value: item.startAt,
      onChange: handleStartChange,
    },
    {
      key: 'endAt' as const,
      id: `play-time-record-end-${item.id}`,
      label: '结束时间',
      ariaLabel: `编辑第 ${index + 1} 条记录的结束时间`,
      placeholder: '选择结束时间',
      value: item.endAt,
      onChange: handleEndChange,
    },
  ]

  return (
    <div
      className={cn(
        'bg-muted/20 dark:bg-input/20 flex flex-col gap-2.5 rounded-lg border p-3',
        isEditing && 'sm:col-span-2',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-medium tabular-nums">#{index + 1}</span>
          <Badge variant="outline" className="tabular-nums">
            {formatDuration(durationSeconds)}
          </Badge>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={isEditing ? `完成编辑第 ${index + 1} 条记录` : `编辑第 ${index + 1} 条记录`}
            onClick={() => onToggleEdit(item.id)}
          >
            {isEditing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`删除第 ${index + 1} 条记录`}
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="min-w-0 space-y-1.5">
              <Label htmlFor={field.id} className="text-muted-foreground text-xs font-normal">
                {field.label}
              </Label>
              <PlayTimeDateTimePicker
                id={field.id}
                ariaLabel={field.ariaLabel}
                placeholder={field.placeholder}
                dateValue={toDateInput(field.value)}
                timeValue={toTimeInput(field.value)}
                onChange={field.onChange}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-0.5 text-sm tabular-nums">
          <div className="truncate" title={formatDateTime(item.startAt)}>
            开始：{formatDateTime(item.startAt)}
          </div>
          <div className="truncate" title={formatDateTime(item.endAt)}>
            结束：{formatDateTime(item.endAt)}
          </div>
        </div>
      )}
    </div>
  )
})
