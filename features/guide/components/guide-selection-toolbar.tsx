'use client'

import { CheckIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useState } from 'react'

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

type GuideSelectionToolbarProps = {
  selectedCount: number
  totalCount: number
  isDeleting: boolean
  onSelectAll: () => void
  onClear: () => void
  /** 确认删除，返回是否成功（成功后自动关闭确认框） */
  onConfirmDelete: () => Promise<boolean>
}

export default function GuideSelectionToolbar({
  selectedCount,
  totalCount,
  isDeleting,
  onSelectAll,
  onClear,
  onConfirmDelete,
}: GuideSelectionToolbarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirm = async () => {
    const success = await onConfirmDelete()
    if (success) {
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <div className="bg-background/95 fixed bottom-4 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border p-2 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2Icon className="size-4" />
            删除
          </Button>

          <Button variant="outline" size="sm" onClick={onClear}>
            <XIcon className="size-4" />
            取消
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={selectedCount >= totalCount}
            onClick={onSelectAll}
          >
            <CheckIcon className="size-4" />
            全选
          </Button>

          <div className="px-1 text-sm font-medium">已选择 {selectedCount} 项</div>
        </div>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setConfirmOpen(open)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除攻略</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除已选择的 {selectedCount}{' '}
              篇攻略吗？将连同其下的路线、结局与步骤一起删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirm()
              }}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
