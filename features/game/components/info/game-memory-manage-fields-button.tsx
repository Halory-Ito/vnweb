'use client'

import { Settings2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

export function GameMemoryManageFieldsButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
        <Settings2Icon className="size-3.5" />
        管理字段
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>前往回忆设置？</AlertDialogTitle>
            <AlertDialogDescription>
              即将跳转到「设置 → 回忆」页面，当前表单中未保存的内容将会丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="outline"
              onClick={() => {
                setOpen(false)
                router.push('/settings/memory')
              }}
            >
              确认跳转
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
