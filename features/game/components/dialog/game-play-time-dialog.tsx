'use client'

import { Plus } from 'lucide-react'

import { useGamePlayTimeDialog } from '../../hooks/use-game-play-time-dialog'
import { formatDuration } from '../../lib/play-time-format'
import { GamePlayTimeRecordCard } from './game-play-time-record-card'
import { PlayTimeBatchDeletePopover } from './play-time-batch-delete-popover'
import { PlayTimeDateTimePicker } from './play-time-date-time-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type GamePlayTimeDialogProps = {
  gameId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GamePlayTimeDialog({
  gameId,
  open,
  onOpenChange,
}: GamePlayTimeDialogProps) {
  const {
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
  } = useGamePlayTimeDialog({ gameId, open, onOpenChange })

  const newRangeFields = [
    {
      id: 'play-time-new-start',
      label: '开始时间',
      ariaLabel: '选择开始时间',
      placeholder: '选择开始时间',
      dateValue: newStartDate,
      timeValue: newStartTime,
      onChange: handleNewStartChange,
    },
    {
      id: 'play-time-new-end',
      label: '结束时间',
      ariaLabel: '选择结束时间',
      placeholder: '选择结束时间',
      dateValue: newEndDate,
      timeValue: newEndTime,
      onChange: handleNewEndChange,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>游玩时间</DialogTitle>
          <DialogDescription className="sr-only">添加或调整该游戏的游玩时间记录</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="shrink-0 space-y-2.5">
            <div className="text-sm font-medium">添加计时器</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {newRangeFields.map((field) => (
                <div key={field.id} className="min-w-0 space-y-1.5">
                  <Label htmlFor={field.id} className="text-muted-foreground text-xs font-normal">
                    {field.label}
                  </Label>
                  <PlayTimeDateTimePicker
                    id={field.id}
                    ariaLabel={field.ariaLabel}
                    placeholder={field.placeholder}
                    dateValue={field.dateValue}
                    timeValue={field.timeValue}
                    onChange={field.onChange}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="w-full" onClick={handleAdd}>
                <Plus className="size-4" />
                添加
              </Button>
              <PlayTimeBatchDeletePopover
                records={records}
                disabled={isLoading || isSaving}
                onConfirm={handleBatchDeleteBelowDuration}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-3">
            {isLoading ? (
              <div className="text-muted-foreground text-sm">加载中...</div>
            ) : records.length === 0 ? (
              <div className="text-muted-foreground text-sm">暂无计时器</div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {records.map((item, index) => (
                  <GamePlayTimeRecordCard
                    key={item.id}
                    item={item}
                    index={index}
                    isEditing={editingId === item.id}
                    onToggleEdit={handleToggleEdit}
                    onDelete={handleDelete}
                    onFieldChange={handleRecordFieldChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex w-full shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm tabular-nums">总游戏时长：{formatDuration(totalSeconds)}</div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="button" disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
