'use client'

import { useQuery } from '@tanstack/react-query'
import { Flag, Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/request-utils'

type Route = {
  id: string
  name: string
}

export default function AddEnding() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('normal')
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取路线列表
  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ['guide-routes'],
    queryFn: () => api.get('/guide/routes'),
    enabled: open,
  })

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请输入结局名称')
      return
    }
    if (!selectedRouteId) {
      toast.error('请选择路线')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/guide/ending', {
        name: name.trim(),
        type,
        routeId: selectedRouteId,
      })
      toast.success('结局添加成功')
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error('添加结局失败:', error)
      toast.error('添加结局失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName('')
    setType('normal')
    setSelectedRouteId('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2">
          <Flag className="h-4 w-4" />
          新增结局
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增结局</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 选择路线 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">所属路线</div>
            <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择路线" />
              </SelectTrigger>
              <SelectContent>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 结局名称 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">结局名称</div>
            <Input
              placeholder="输入结局名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 结局类型 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">结局类型</div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">普通结局</SelectItem>
                <SelectItem value="good">好结局</SelectItem>
                <SelectItem value="bad">坏结局</SelectItem>
                <SelectItem value="true">真结局</SelectItem>
              </SelectContent>
            </Select>
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
            disabled={!name.trim() || !selectedRouteId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                添加中...
              </>
            ) : (
              '添加结局'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
