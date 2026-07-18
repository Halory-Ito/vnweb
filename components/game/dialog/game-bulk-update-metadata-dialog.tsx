'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { batchUpdateGameMetadata } from '@/lib/game/game-utils'

type BulkProvider = 'bangumi' | 'steamgriddb'
type MergeStrategy = 'replace' | 'merge' | 'append'
type FieldKey =
  | 'date'
  | 'cover'
  | 'icon'
  | 'logo'
  | 'bg'
  | 'summary'
  | 'name'
  | 'nameCn'
  | 'tags'
  | 'nsfw'
  | 'ailases'
  | 'platforms'
  | 'gameType'
  | 'gameEngine'
  | 'music'
  | 'script'
  | 'graphic'
  | 'originalPainter'
  | 'animationProduction'
  | 'developer'
  | 'publisher'
  | 'programmer'

type BulkUpdateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameIds: string[]
}

const fieldConfigs: Array<{ key: FieldKey; label: string }> = [
  { key: 'date', label: '发布日期' },
  { key: 'cover', label: '封面' },
  { key: 'icon', label: '图标' },
  { key: 'logo', label: '徽标' },
  { key: 'bg', label: '背景' },
  { key: 'summary', label: '简介' },
  { key: 'name', label: '游戏名称' },
  { key: 'nameCn', label: '中文名称' },
  { key: 'tags', label: '标签' },
  { key: 'nsfw', label: 'NSFW' },
  { key: 'ailases', label: '别名' },
  { key: 'platforms', label: '平台' },
  { key: 'gameType', label: '游戏类型' },
  { key: 'gameEngine', label: '游戏引擎' },
  { key: 'music', label: '音乐' },
  { key: 'script', label: '剧本' },
  { key: 'graphic', label: '美术' },
  { key: 'originalPainter', label: '原画' },
  { key: 'animationProduction', label: '动画制作' },
  { key: 'developer', label: '开发商' },
  { key: 'publisher', label: '发行商' },
  { key: 'programmer', label: '程序' },
]

const createAllFieldsState = () =>
  fieldConfigs.reduce(
    (acc, item) => {
      acc[item.key] = true
      return acc
    },
    {} as Record<FieldKey, boolean>,
  )

export default function GameBulkUpdateMetadataDialog({
  open,
  onOpenChange,
  gameIds,
}: BulkUpdateDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [provider, setProvider] = useState<BulkProvider>('bangumi')
  const [strategy, setStrategy] = useState<MergeStrategy>('replace')
  const [queryText, setQueryText] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedFields, setSelectedFields] =
    useState<Record<FieldKey, boolean>>(createAllFieldsState)

  const selectedFieldKeys = useMemo(
    () =>
      fieldConfigs
        .map((item) => item.key)
        .filter((key) => Boolean(selectedFields[key])),
    [selectedFields],
  )

  const handleToggleField = (key: FieldKey, checked: boolean) => {
    setSelectedFields((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  const handleSelectAllFields = () => {
    setSelectedFields(createAllFieldsState())
  }

  const handleClearAllFields = () => {
    setSelectedFields((prev) => {
      const next = { ...prev }
      fieldConfigs.forEach((field) => {
        next[field.key] = false
      })
      return next
    })
  }

  const handleInvertFields = () => {
    setSelectedFields((prev) => {
      const next = { ...prev }
      fieldConfigs.forEach((field) => {
        next[field.key] = !prev[field.key]
      })
      return next
    })
  }

  const handleSubmit = async () => {
    if (gameIds.length === 0) {
      return
    }

    if (selectedFieldKeys.length === 0) {
      toast.error('请至少选择一个字段')
      return
    }

    setIsUpdating(true)
    try {
      const result = await batchUpdateGameMetadata({
        gameIds: gameIds.map((id) => Number(id)),
        provider,
        query: queryText.trim(),
        fields: selectedFieldKeys,
        strategy,
      })

      await queryClient.invalidateQueries({ queryKey: ['game'] })
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      router.refresh()

      toast.success(
        `批量更新完成：成功 ${result.data.updatedCount}，跳过 ${result.data.skippedCount}，失败 ${result.data.failedCount}`,
      )
      onOpenChange(false)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '批量更新失败')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>批量更新元数据</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-sm font-medium">指定数据源</div>
              <Select
                value={provider}
                onValueChange={(value) => setProvider(value as BulkProvider)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择数据源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bangumi">Bangumi</SelectItem>
                  <SelectItem value="steamgriddb">SteamGrid DB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">合并策略</div>
              <Select
                value={strategy}
                onValueChange={(value) => setStrategy(value as MergeStrategy)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择策略" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">替换</SelectItem>
                  <SelectItem value="merge">合并</SelectItem>
                  <SelectItem value="append">追加</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">查询关键词或 ID</div>
            <Input
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              placeholder="可选：输入关键词或数字 ID（留空则按各游戏名称查询）"
            />
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">
                选择要更新的字段（已选 {selectedFieldKeys.length} 项）
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllFields}
                >
                  全选
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleInvertFields}
                >
                  反选
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleClearAllFields}
                >
                  全不选
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {fieldConfigs.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={Boolean(selectedFields[field.key])}
                    onCheckedChange={(checked) =>
                      handleToggleField(field.key, Boolean(checked))
                    }
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={isUpdating}
            onClick={() => void handleSubmit()}
          >
            {isUpdating ? '批量更新中...' : '批量更新'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
