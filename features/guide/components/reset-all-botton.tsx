'use client'

import { RotateCcw } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ResetAllButtonProps {
  /** AlertDialog 标题 */
  title?: string
  /** AlertDialog 描述 */
  description?: string
  /** 确认重置后的回调函数 */
  onConfirm: () => void
  /** 是否禁用按钮 */
  disabled?: boolean
  /** 按钮的 tooltip 文本 */
  buttonTitle?: string
}

export function ResetAllButton({
  title = '重置进度',
  description = '确定要重置所有进度吗？此操作将清除所有完成状态。',
  onConfirm,
  disabled = false,
  buttonTitle = '重置',
}: ResetAllButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          title={buttonTitle}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            确认重置
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
