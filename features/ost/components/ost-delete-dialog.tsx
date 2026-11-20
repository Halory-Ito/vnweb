'use client'

import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { OstItem } from '../types'

type OstDeleteDialogProps = {
  item: OstItem | null
  batchCount?: number
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function OstDeleteDialog({
  item,
  batchCount = 0,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: OstDeleteDialogProps) {
  return (
    <Dialog
      open={!!item || batchCount > 0}
      onOpenChange={(open) => !isSubmitting && onOpenChange(open)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{batchCount ? '批量删除 OST' : '删除 OST'}</DialogTitle>
          <DialogDescription>
            {batchCount
              ? `确定删除选中的 ${batchCount} 张 OST 及其曲目吗？此操作无法撤销。`
              : `确定要删除 OST「${item?.name}」吗？此操作无法撤销。`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                删除中...
              </>
            ) : (
              '删除'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
