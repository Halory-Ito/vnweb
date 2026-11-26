'use client'

import { Trash2 } from 'lucide-react'
import { memo } from 'react'

import { usePlayTimeBatchDelete } from '../../hooks/use-play-time-batch-delete'
import { PLAY_TIME_DURATION_UNITS, type PlayTimeRecordFormItem } from '../../lib/play-time-format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type PlayTimeBatchDeletePopoverProps = {
  records: readonly PlayTimeRecordFormItem[]
  disabled?: boolean
  onConfirm: (thresholdSeconds: number) => void
}

/** Outlined popover control to batch-delete play-time records shorter than a duration. */
export const PlayTimeBatchDeletePopover = memo(function PlayTimeBatchDeletePopover({
  records,
  disabled,
  onConfirm,
}: PlayTimeBatchDeletePopoverProps) {
  const {
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
  } = usePlayTimeBatchDelete({ records, onConfirm })

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || records.length === 0}
            className="w-full"
          >
            <Trash2 className="size-4" />
            批量删除
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 max-w-[calc(100vw-2rem)] space-y-3 p-3.5">
          <div className="text-sm font-medium">删除过短计时器</div>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              handleRequestConfirm()
            }}
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="play-time-batch-delete-threshold"
                className="text-muted-foreground text-xs font-normal"
              >
                时长低于
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="play-time-batch-delete-threshold"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  aria-label="低于指定时长"
                  value={thresholdInput}
                  onChange={(event) => setThresholdInput(event.target.value)}
                  className="min-w-0 flex-1 border tabular-nums"
                />
                <ButtonGroup>
                  {PLAY_TIME_DURATION_UNITS.map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      variant={unit === item.value ? 'default' : 'outline'}
                      aria-pressed={unit === item.value}
                      className="px-2.5"
                      onClick={() => setUnit(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-muted-foreground text-xs tabular-nums">
                匹配 {matchedCount} 条
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                  取消
                </Button>
                <Button type="submit" variant="destructive" size="sm" disabled={matchedCount === 0}>
                  删除
                </Button>
              </div>
            </div>
          </form>
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除时长低于 {thresholdLabel} 的 {matchedCount} 条计时器吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
