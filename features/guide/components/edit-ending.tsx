'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil } from 'lucide-react'
import Image from 'next/image'
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
import { Textarea } from '@/components/ui/textarea'
import { getCharactersByGameIdApi } from '@/features/character/character-api'
import { getEndingApi, updateEndingApi } from '@/features/guide/guide-api'
import { cn } from '@/lib/utils'

interface EditEndingProps {
  endingId: string
  gameId: number
  onSuccess?: () => void
}

export function EditEnding({ endingId, gameId, onSuccess }: EditEndingProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('normal')
  const [requirements, setRequirements] = useState('')
  const [cover, setCover] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // 获取结局信息
  const { data: endingData, isLoading: isEndingLoading } = useQuery({
    queryKey: ['ending', endingId],
    queryFn: () => getEndingApi(endingId),
    enabled: open,
  })

  // 回填数据
  useEffect(() => {
    if (endingData) {
      setName(endingData.name)
      setType(endingData.type || 'normal')
      setRequirements(endingData.requirements || '')
      setCover(endingData.cover || '')
    }
  }, [endingData])

  // 获取游戏角色列表
  const { data: characters = [], isLoading: isCharactersLoading } = useQuery({
    queryKey: ['characters', gameId],
    queryFn: () => getCharactersByGameIdApi(gameId),
    enabled: open,
  })

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请输入结局名称')
      return
    }

    setIsSubmitting(true)
    try {
      await updateEndingApi(endingId, {
        name: name.trim(),
        type,
        requirements: requirements.trim() || undefined,
        cover: cover || undefined,
      })
      toast.success('结局更新成功')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['guide'] })
      queryClient.invalidateQueries({ queryKey: ['ending', endingId] })
      onSuccess?.()
    } catch (error) {
      console.error('更新结局失败:', error)
      toast.error('更新结局失败，请稍后重试')
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑结局</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 结局名称 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">结局名称</div>
            <Input
              placeholder="输入结局名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEndingLoading}
            />
          </div>

          {/* 结局类型 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">结局类型</div>
            <Select value={type} onValueChange={setType} disabled={isEndingLoading}>
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

          {/* 开启条件 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              开启条件 <span className="text-muted-foreground">(可选)</span>
            </div>
            <Textarea
              placeholder="输入开启条件..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              disabled={isEndingLoading}
              rows={2}
            />
          </div>

          {/* 封面选择 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              封面 <span className="text-muted-foreground">(从角色中选择)</span>
            </div>
            {isCharactersLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载角色列表...
              </div>
            ) : characters.length > 0 ? (
              <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto">
                {characters.map((character) => (
                  <button
                    key={character.id}
                    type="button"
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                      cover === character.imageUrl
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-muted-foreground/30',
                    )}
                    onClick={() => setCover(character.imageUrl)}
                  >
                    {character.imageUrl ? (
                      <Image
                        src={character.imageUrl}
                        alt={character.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="bg-muted text-muted-foreground flex h-full items-center justify-center text-xs">
                        {character.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute right-0 bottom-0 left-0 truncate bg-black/60 px-1 py-0.5 text-center text-xs text-white">
                      {character.name}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">暂无角色数据</div>
            )}
            {cover && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCover('')}
                className="text-xs"
              >
                清除封面
              </Button>
            )}
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
            disabled={!name.trim() || isSubmitting || isEndingLoading}
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
