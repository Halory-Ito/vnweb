'use client'

import { useQuery } from '@tanstack/react-query'
import { Footprints, Loader2 } from 'lucide-react'
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

type Ending = {
  id: string
  name: string
  routeName: string
}

export default function AddStep() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('choice')
  const [content, setContent] = useState('')
  const [group, setGroup] = useState('')
  const [prefix, setPrefix] = useState('')
  const [subfix, setSubfix] = useState('')
  const [selectedEndingId, setSelectedEndingId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取结局列表
  const { data: endings = [] } = useQuery<Ending[]>({
    queryKey: ['guide-endings'],
    queryFn: () => api.get('/guide/endings'),
    enabled: open,
  })

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('请输入步骤内容')
      return
    }
    if (!selectedEndingId) {
      toast.error('请选择结局')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/guide/step', {
        type,
        content: content.trim(),
        group: group.trim() || undefined,
        prefix: prefix.trim() || undefined,
        subfix: subfix.trim() || undefined,
        endingId: selectedEndingId,
      })
      toast.success('步骤添加成功')
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error('添加步骤失败:', error)
      toast.error('添加步骤失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setType('choice')
    setContent('')
    setGroup('')
    setPrefix('')
    setSubfix('')
    setSelectedEndingId('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2">
          <Footprints className="h-4 w-4" />
          新增步骤
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增步骤</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 选择结局 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">所属结局</div>
            <Select value={selectedEndingId} onValueChange={setSelectedEndingId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择结局" />
              </SelectTrigger>
              <SelectContent>
                {endings.map((ending) => (
                  <SelectItem key={ending.id} value={ending.id}>
                    {ending.routeName} - {ending.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 步骤类型 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">步骤类型</div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="choice">选项</SelectItem>
                <SelectItem value="save">存档</SelectItem>
                <SelectItem value="load">读档</SelectItem>
                <SelectItem value="note">备注</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 步骤内容 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">步骤内容</div>
            <Input
              placeholder="输入步骤内容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* 分组（可选） */}
          <div className="space-y-2">
            <div className="text-sm font-medium">分组 <span className="text-muted-foreground">(可选)</span></div>
            <Input
              placeholder="例如：7月15日"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />
          </div>

          {/* 前缀和后缀 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">前缀 <span className="text-muted-foreground">(可选)</span></div>
              <Input
                placeholder="例如：★"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">后缀 <span className="text-muted-foreground">(可选)</span></div>
              <Input
                placeholder="输入后缀..."
                value={subfix}
                onChange={(e) => setSubfix(e.target.value)}
              />
            </div>
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
            disabled={!content.trim() || !selectedEndingId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                添加中...
              </>
            ) : (
              '添加步骤'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
