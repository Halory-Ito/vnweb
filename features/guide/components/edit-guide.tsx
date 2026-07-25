'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, X } from 'lucide-react'
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
import { getGuideApi, updateGuideApi } from '@/features/guide/guide-api'

interface EditGuideProps {
  gameId: number
  onSuccess?: () => void
}

export function EditGuide({ gameId, onSuccess }: EditGuideProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [level, setLevel] = useState(0)
  const [tips, setTips] = useState<string[]>([])
  const [newTip, setNewTip] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // 获取攻略信息
  const { data: guideData, isLoading } = useQuery({
    queryKey: ['guide', gameId],
    queryFn: () => getGuideApi(gameId),
    enabled: open,
  })

  // 回填数据
  useEffect(() => {
    if (guideData) {
      setName(guideData.name)
      setLevel(guideData.level || 0)
      setTips(guideData.tips || [])
    }
  }, [guideData])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请输入攻略名称')
      return
    }

    setIsSubmitting(true)
    try {
      await updateGuideApi(gameId, {
        name: name.trim(),
        level,
        tips,
      })
      toast.success('攻略更新成功')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
      onSuccess?.()
    } catch (error) {
      console.error('更新攻略失败:', error)
      toast.error('更新攻略失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTip = () => {
    if (newTip.trim()) {
      setTips([...tips, newTip.trim()])
      setNewTip('')
    }
  }

  const removeTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑攻略</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 攻略名称 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">攻略名称</div>
            <Input
              placeholder="输入攻略名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* 难度等级 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">难度等级</div>
            <Select
              value={String(level)}
              onValueChange={(value) => setLevel(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">未设置</SelectItem>
                <SelectItem value="1">简单</SelectItem>
                <SelectItem value="2">普通</SelectItem>
                <SelectItem value="3">困难</SelectItem>
                <SelectItem value="4">地狱</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 提示信息 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">提示信息</div>
            <div className="space-y-2">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={tip} readOnly className="flex-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTip(index)}
                    className="h-8 w-8 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="添加新提示..."
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTip()}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addTip}
                  disabled={!newTip.trim() || isLoading}
                  className="h-8 w-8 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
