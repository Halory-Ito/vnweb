'use client'

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

type OverwriteGuideAlertProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameTitle?: string
  onConfirm: () => void
  isLoading?: boolean
}

export default function OverwriteGuideAlert({
  open,
  onOpenChange,
  gameTitle,
  onConfirm,
  isLoading = false,
}: OverwriteGuideAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>覆盖已有攻略</AlertDialogTitle>
          <AlertDialogDescription>
            {gameTitle
              ? `「${gameTitle}」已存在攻略，确认覆盖吗？覆盖后将删除原攻略（包括路线、结局和步骤）并导入新攻略。`
              : '该游戏已存在攻略，确认覆盖吗？覆盖后将删除原攻略（包括路线、结局和步骤）并导入新攻略。'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? '覆盖中...' : '确认覆盖'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
