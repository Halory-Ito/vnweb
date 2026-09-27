'use client'

import { Loader2, Route } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/request-utils'

export default function AddRoute() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请输入路线名称')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/guide/route', { name: name.trim() })
      toast.success('路线添加成功')
      setOpen(false)
      setName('')
    } catch (error) {
      console.error('添加路线失败:', error)
      toast.error('添加路线失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2">
          <Route className="h-4 w-4" />
          新增路线
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增路线</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">路线名称</div>
            <Input
              placeholder="输入路线名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                添加中...
              </>
            ) : (
              '添加路线'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
