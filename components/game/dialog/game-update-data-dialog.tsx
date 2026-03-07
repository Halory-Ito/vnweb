'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { updateGameInfoById } from '@/lib/game-utils'
import { getGameInfoByIdApi, searchGameByNameApi } from '@/lib/vndb-utils'

import type { GameInfo } from '@/types/game-types'

type GameUpdateDataDialogProps = {
  gameId: number
  initialKeyword?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type GameSearchItem = {
  id: string
  name: string
  developer: string
  date: string
}

type GameInfoFieldKey = Extract<keyof GameInfo, string>

const fieldConfigs: Array<{ key: GameInfoFieldKey; label: string }> = [
  { key: 'date', label: '发布日期' },
  { key: 'cover', label: '封面' },
  { key: 'summary', label: '简介' },
  { key: 'name', label: '游戏名称' },
  { key: 'nameCn', label: '中文名称' },
  { key: 'tags', label: '标签' },
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

export default function GameUpdateDataDialog({
  gameId,
  initialKeyword,
  open,
  onOpenChange,
}: GameUpdateDataDialogProps) {
  const pageSize = 5
  const router = useRouter()
  const queryClient = useQueryClient()
  const [provider, setProvider] = useState('bangumi')
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<GameSearchItem[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotal, setSearchTotal] = useState(0)
  const [selectedId, setSelectedId] = useState('')
  const [fetchedInfo, setFetchedInfo] = useState<GameInfo | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingInfo, setIsFetchingInfo] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(
    {},
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const nextKeyword = (initialKeyword || '').trim()
    if (nextKeyword) {
      setKeyword(nextKeyword)
    }
  }, [open, initialKeyword])

  const selectedCount = useMemo(
    () => Object.values(selectedFields).filter(Boolean).length,
    [selectedFields],
  )

  const loadSearchResults = async (page: number) => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      toast.error('请输入关键词')
      return
    }

    setIsSearching(true)
    try {
      const nextOffset = (page - 1) * pageSize
      const response = await searchGameByNameApi(
        trimmed,
        provider,
        nextOffset,
        pageSize,
      )
      setResults(response.items)
      setSearchTotal(response.total)
      setSearchPage(page)
      if (response.items.length === 0) {
        toast.error('未搜索到结果')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = async () => {
    await loadSearchResults(1)
  }

  const handleFetchInfoById = async (id: string) => {
    if (!id) {
      toast.error('请先选择或输入 ID')
      return
    }

    setIsFetchingInfo(true)
    try {
      const info = await getGameInfoByIdApi(id, provider)
      if (!info) {
        toast.error('未获取到资料')
        return
      }

      setSelectedId(id)
      setFetchedInfo(info)
      const next: Record<string, boolean> = {}
      fieldConfigs.forEach((field) => {
        next[field.key] = true
      })
      setSelectedFields(next)
    } finally {
      setIsFetchingInfo(false)
    }
  }

  const toggleField = (key: GameInfoFieldKey, checked: boolean) => {
    setSelectedFields((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  const handleApply = async () => {
    if (!fetchedInfo) {
      toast.error('请先获取资料')
      return
    }

    const payload: Record<string, unknown> = {}
    for (const field of fieldConfigs) {
      if (!selectedFields[field.key]) {
        continue
      }
      payload[field.key] = fetchedInfo[field.key]
    }

    if (Object.keys(payload).length === 0) {
      toast.error('请至少选择一个属性')
      return
    }

    setIsUpdating(true)
    try {
      await updateGameInfoById(gameId, payload as never)
      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
      router.refresh()
      toast.success('资料已更新')
      onOpenChange(false)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '更新失败')
    } finally {
      setIsUpdating(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(searchTotal / pageSize))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>更新资料数据</DialogTitle>
          <DialogDescription>
            选择数据源并搜索，勾选需要覆盖的属性后更新
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="选择数据源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bangumi">Bangumi</SelectItem>
                <SelectItem value="steamgriddb">SteamGrid DB</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入名称搜索"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSearch()}
              disabled={isSearching}
            >
              {isSearching ? '搜索中...' : '搜索'}
            </Button>
          </div>

          <div className="space-y-2 rounded-md border p-2">
            {results.length === 0 ? (
              <div className="text-muted-foreground p-2 text-sm">
                暂无搜索结果
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{item.name || '-'}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      ID: {item.id} / {item.date || '-'}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleFetchInfoById(item.id)}
                    disabled={isFetchingInfo}
                  >
                    使用
                  </Button>
                </div>
              ))
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSearching || searchPage <= 1}
                onClick={() => void loadSearchResults(searchPage - 1)}
              >
                上一页
              </Button>
              <div className="text-muted-foreground self-center text-sm">
                第 {searchPage} / {totalPages} 页
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isSearching || searchPage >= totalPages}
                onClick={() => void loadSearchResults(searchPage + 1)}
              >
                下一页
              </Button>
            </DialogFooter>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="text-sm font-medium">
              选择要更新的属性（已选 {selectedCount} 项）
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
                      toggleField(field.key, Boolean(checked))
                    }
                    disabled={!fetchedInfo}
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedId ? (
            <div className="text-muted-foreground text-xs">
              当前资料来源 ID: {selectedId}
            </div>
          ) : null}
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
            onClick={() => void handleApply()}
            disabled={isUpdating || !fetchedInfo}
          >
            {isUpdating ? '更新中...' : '确认更新'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
