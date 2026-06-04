'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { QuoteManageItem } from '@/lib/game/game-utils'

type QuoteDeleteDialogProps = {
  item: QuoteManageItem | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function QuoteDeleteDialog({
  item,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: QuoteDeleteDialogProps) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除这条台词摘录吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm">{item.content}</p>
            {item.characterName && (
              <p className="text-muted-foreground mt-2 text-xs">
                —— {item.characterName}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
