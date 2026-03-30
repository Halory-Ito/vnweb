'use client'

import { Gamepad2Icon, X } from 'lucide-react'

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type GamePlayStatusDialogProps = {
  gameId: number
  gameTitle: string
  currentStatus: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (status: number) => void
  disabled?: boolean
}

const statusLabelMap: Record<number, string> = {
  0: '未开始',
  1: '游玩中',
  2: '部分完成',
  3: '已完成',
  4: '多周目',
  5: '搁置中',
}

const statusOptions = [0, 1, 2, 3, 4, 5] as const

export default function GamePlayStatusDialog({
  gameTitle,
  currentStatus,
  open,
  onOpenChange,
  onStatusChange,
  disabled,
}: GamePlayStatusDialogProps) {
  const handleSelect = (status: number) => {
    onStatusChange(status)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2Icon className="size-5" />
            修改游玩状态
          </DialogTitle>
          <DialogDescription>为「{gameTitle}」选择游玩状态</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={String(currentStatus)}
            onValueChange={(value) => handleSelect(Number(value))}
            className="grid grid-cols-2 gap-3"
          >
            {statusOptions.map((status) => (
              <div key={status} className="relative">
                <RadioGroupItem
                  value={String(status)}
                  id={`status-${status}`}
                  className="peer sr-only"
                  disabled={disabled}
                />
                <Label
                  htmlFor={`status-${status}`}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 transition-all duration-200 ${
                    currentStatus === status
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className="font-medium">{statusLabelMap[status]}</span>
                </Label>
                {currentStatus === status && (
                  <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full">
                    <svg
                      className="size-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={disabled}
          >
            <X className="mr-2 size-4" />
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
