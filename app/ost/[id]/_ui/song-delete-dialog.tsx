'use client'

import { Trash2Icon, TriangleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OstSongItem } from '@/lib/game-utils'

type SongDeleteDialogProps = {
  item: OstSongItem | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function SongDeleteDialog({
  item,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: SongDeleteDialogProps) {
  if (!item) return null

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <TriangleAlertIcon className="size-5" />
            删除歌曲确认
          </DialogTitle>
          <DialogDescription className="pt-3">
            您确定要删除歌曲{' '}
            <span className="text-foreground font-semibold">
              {item.name}
            </span>{' '}
            吗？ 此操作不可撤销，删除后该歌曲将从专辑中移除。
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
            className="shadow-destructive/20 w-full shadow-sm hover:shadow-md sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                删除中...
              </>
            ) : (
              <>
                <Trash2Icon className="mr-2 size-4" />
                确认删除
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
