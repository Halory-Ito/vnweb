'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { getRouteApi, updateRouteApi } from '@/features/guide/guide-api'

interface EditRouteProps {
  routeId: string
  onSuccess?: () => void
}

export function EditRoute({ routeId, onSuccess }: EditRouteProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // 获取路线信息
  const { data, isLoading } = useQuery({
    queryKey: ['route', routeId],
    queryFn: () => getRouteApi(routeId),
    enabled: open,
  })

  // 回填数据
  useEffect(() => {
    if (data) {
      setName(data.name)
    }
  }, [data])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请输入路线名称')
      return
    }

    setIsSubmitting(true)
    try {
      await updateRouteApi(routeId, { name: name.trim() })
      toast.success('路线更新成功')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['guide'] })
      queryClient.invalidateQueries({ queryKey: ['route', routeId] })
      onSuccess?.()
    } catch (error) {
      console.error('更新路线失败:', error)
      toast.error('更新路线失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑路线</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">路线名称</div>
            <Input
              placeholder="输入路线名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isLoading}
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
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
