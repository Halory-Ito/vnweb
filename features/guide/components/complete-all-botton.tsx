'use client'

import { ListChecks } from 'lucide-react'

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

interface CompleteAllButtonProps {
  /** AlertDialog 标题 */
  title?: string
  /** AlertDialog 描述 */
  description?: string
  /** 确认标记后的回调函数 */
  onConfirm: () => void
  /** 是否禁用按钮 */
  disabled?: boolean
  /** 按钮的 tooltip 文本 */
  buttonTitle?: string
}

export function CompleteAllButton({
  title = '标记全部完成',
  description = '确定要将所有步骤标记为已完成吗？',
  onConfirm,
  disabled = false,
  buttonTitle = '标记全部完成',
}: CompleteAllButtonProps) {
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
          <ListChecks className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>确认标记</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
