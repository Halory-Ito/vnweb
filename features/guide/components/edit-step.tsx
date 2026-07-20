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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getStepApi, updateStepApi } from '@/features/guide/guide-api'

interface EditStepProps {
  stepId: string
  onSuccess?: () => void
}

export function EditStep({ stepId, onSuccess }: EditStepProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('choice')
  const [content, setContent] = useState('')
  const [group, setGroup] = useState('')
  const [prefix, setPrefix] = useState('')
  const [subfix, setSubfix] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // 获取步骤信息
  const { data: stepData, isLoading } = useQuery({
    queryKey: ['step', stepId],
    queryFn: () => getStepApi(stepId),
    enabled: open,
  })

  // 回填数据
  useEffect(() => {
    if (stepData) {
      setType(stepData.type || 'choice')
      setContent(stepData.content)
      setGroup(stepData.group || '')
      setPrefix(stepData.prefix || '')
      setSubfix(stepData.subfix || '')
    }
  }, [stepData])

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('请输入步骤内容')
      return
    }

    setIsSubmitting(true)
    try {
      await updateStepApi(stepId, {
        type,
        content: content.trim(),
        group: group.trim() || undefined,
        prefix: prefix.trim() || undefined,
        subfix: subfix.trim() || undefined,
      })
      toast.success('步骤更新成功')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['guide'] })
      queryClient.invalidateQueries({ queryKey: ['steps'] })
      queryClient.invalidateQueries({ queryKey: ['step', stepId] })
      onSuccess?.()
    } catch (error) {
      console.error('更新步骤失败:', error)
      toast.error('更新步骤失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑步骤</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 步骤类型 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">步骤类型</div>
            <Select value={type} onValueChange={setType} disabled={isLoading}>
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
              disabled={isLoading}
            />
          </div>

          {/* 分组（可选） */}
          <div className="space-y-2">
            <div className="text-sm font-medium">分组 <span className="text-muted-foreground">(可选)</span></div>
            <Input
              placeholder="例如：7月15日"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">后缀 <span className="text-muted-foreground">(可选)</span></div>
              <Input
                placeholder="输入后缀..."
                value={subfix}
                onChange={(e) => setSubfix(e.target.value)}
                disabled={isLoading}
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
            disabled={!content.trim() || isSubmitting || isLoading}
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
