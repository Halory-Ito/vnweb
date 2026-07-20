'use client'

import { useQuery } from '@tanstack/react-query'
import { FileQuestion, ImportIcon, Loader2, Search } from 'lucide-react'
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
import { searchGuidesApi, importGuideApi, type GuideSearchResult } from '@/features/guide/guide-api'
import { getGameCardList } from '@/lib/game/game-utils'

export default function ImportGuide() {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<GuideSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<GuideSearchResult | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)

  // 获取本地游戏列表
  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
    enabled: open,
  })

  // 搜索攻略
  const handleSearch = async () => {
    if (!keyword.trim()) return

    setIsSearching(true)
    setHasSearched(false)
    try {
      const data = await searchGuidesApi(keyword)
      setSearchResults(data.list || [])
      setHasSearched(true)
    } catch (error) {
      console.error('搜索攻略失败:', error)
      toast.error('搜索攻略失败，请稍后重试')
    } finally {
      setIsSearching(false)
    }
  }

  // 导入攻略
  const handleImport = async () => {
    if (!selectedGuide || !selectedGameId) {
      toast.error('请选择攻略和游戏')
      return
    }

    setIsImporting(true)
    try {
      // 获取选中游戏的 cover
      const selectedGame = gameCards.find((g) => g.id === selectedGameId)
      const gameCover = selectedGame?.cover || ''

      // 调用导入 API，使用游戏的 cover
      await importGuideApi({
        gameId: Number(selectedGameId),
        guide: { ...selectedGuide, cover: gameCover },
      })

      toast.success('攻略导入成功')
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error('导入攻略失败:', error)
      toast.error('导入攻略失败，请稍后重试')
    } finally {
      setIsImporting(false)
    }
  }

  // 重置表单
  const resetForm = () => {
    setKeyword('')
    setSearchResults([])
    setHasSearched(false)
    setSelectedGuide(null)
    setSelectedGameId('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2">
          <ImportIcon className="h-4 w-4" />
          导入攻略
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>导入攻略</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索区域 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">搜索攻略</div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  className="pr-4 pl-10"
                  placeholder="输入游戏名称搜索攻略..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Search className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSearch}
                disabled={isSearching || !keyword.trim()}
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : '搜索'}
              </Button>
            </div>
          </div>

          {/* 搜索结果 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">搜索结果</div>
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-2">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                  <p className="text-muted-foreground mt-2 text-sm">搜索中...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((guide) => (
                  <button
                    key={guide.uid}
                    type="button"
                    className={`w-full rounded-md p-2 text-left transition-colors ${
                      selectedGuide?.uid === guide.uid
                        ? 'border-primary/30 bg-primary/10 border'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                    onClick={() => setSelectedGuide(guide)}
                  >
                    <div className="flex items-center gap-3">
                      {guide.cover && (
                        <img
                          src={guide.cover}
                          alt={guide.name['zh-cn']}
                          className="h-16 w-12 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="truncate font-medium">{guide.name['zh-cn']}</div>
                    </div>
                  </button>
                ))
              ) : hasSearched ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileQuestion className="text-muted-foreground h-8 w-8" />
                  <p className="text-muted-foreground mt-2 text-sm">未找到相关攻略</p>
                  <p className="text-muted-foreground text-xs">请尝试其他关键词搜索</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="text-muted-foreground h-8 w-8" />
                  <p className="text-muted-foreground mt-2 text-sm">输入游戏名称搜索攻略</p>
                </div>
              )}
            </div>
          </div>

          {/* 选择游戏 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">绑定游戏</div>
            <Select value={selectedGameId} onValueChange={setSelectedGameId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择要绑定的游戏" />
              </SelectTrigger>
              <SelectContent>
                {gameCards.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isImporting}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!selectedGuide?.uid || !selectedGameId || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                导入中...
              </>
            ) : (
              '导入攻略'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
