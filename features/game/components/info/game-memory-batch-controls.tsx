'use client'

import { ListChecksIcon, Trash2Icon } from 'lucide-react'

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

import type { useGameMemoryBatchDelete } from '../../hooks/use-game-memory-batch-delete'

type GameMemoryBatchControlsProps = {
  batch: ReturnType<typeof useGameMemoryBatchDelete>
  hasItems: boolean
}

export function GameMemoryBatchControls({ batch, hasItems }: GameMemoryBatchControlsProps) {
  if (!batch.active) {
    return (
      <Button type="button" variant="outline" disabled={!hasItems} onClick={batch.enter}>
        <ListChecksIcon />
        批量管理
      </Button>
    )
  }

  return (
    <>
      <span className="text-muted-foreground text-sm" role="status">
        已选 {batch.selectedIds.size} 条
      </span>
      <Button type="button" variant="outline" disabled={!hasItems} onClick={batch.toggleAll}>
        {batch.allSelected ? '取消全选' : '全选'}
      </Button>
      <Button type="button" variant="outline" onClick={batch.exit}>
        退出多选
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={batch.selectedIds.size === 0 || batch.isDeleting}
        onClick={() => batch.setConfirmOpen(true)}
      >
        <Trash2Icon />
        批量删除
      </Button>

      <AlertDialog
        open={batch.confirmOpen}
        onOpenChange={(open) => {
          if (!batch.isDeleting) {
            batch.setConfirmOpen(open)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>批量删除回忆</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除选中的 {batch.selectedIds.size} 条回忆及其关联截图吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batch.isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={batch.isDeleting}
              onClick={(event) => {
                event.preventDefault()
                batch.confirmDelete()
              }}
            >
              {batch.isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
