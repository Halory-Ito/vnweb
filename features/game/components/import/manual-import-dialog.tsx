import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  createGameInfoApi,
  getGameInfoByIdApi,
  searchGameByNameApi,
  type GameSearchItem,
} from '@/features/game/import-api'
import { getManualSearchProviderOptions } from '@/lib/providers'

import type { GameImportDialogProps } from './types'
import type { GameInfo } from '@/types/game'

type GameInfoFormValues = {
  name: string
  nameCn: string
  date: string
  cover: string
  summary: string
  tags: string
  developer: string
  publisher: string
}

export const ManualImportDialog = ({
  children,
  initialProvider,
  lockProvider = false,
  dialogTitle = '添加游戏',
  dialogDescription = '从游戏数据库中导入',
}: GameImportDialogProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const pageSize = 10
  const [gameName, setGameName] = useState<string>('')
  const [gameId, setGameId] = useState<string>('')
  const providerOptions = getManualSearchProviderOptions()
  const defaultProvider = initialProvider ?? providerOptions[0]?.value ?? 'bangumi'
  const [provider, setProvider] = useState<string>(defaultProvider)
  const [searchDialogOpen, setSearchDialogOpen] = useState<boolean>(false)
  const [searchResultDialogOpen, setSearchResultDialogOpen] = useState<boolean>(false)
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [searchPage, setSearchPage] = useState<number>(1)
  const [searchTotal, setSearchTotal] = useState<number>(0)
  const [searchResults, setSearchResults] = useState<GameSearchItem[]>([])
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null)
  const [editableGameInfo, setEditableGameInfo] = useState<GameInfoFormValues | null>(null)

  const toFormValues = (info: GameInfo): GameInfoFormValues => {
    return {
      name: info.name,
      nameCn: info.nameCn,
      date: info.date,
      cover: info.cover,
      summary: info.summary,
      tags: info.tags.join(', '),
      developer: info.developer,
      publisher: info.publisher,
    }
  }

  const handleSearchById = async () => {
    const trimmedId = gameId.trim()
    if (!trimmedId) {
      toast.error('请输入游戏 ID')
      return
    }

    setIsIdentifying(true)
    try {
      const res = await getGameInfoByIdApi(trimmedId, provider)
      if (res === null) {
        toast.error('未找到对应的游戏信息')
        return
      }

      setGameInfo(res)
      setEditableGameInfo(toFormValues(res))
      setSearchDialogOpen(false)
      setEditDialogOpen(true)
    } catch (error) {
      toast.error('识别失败，请检查 ID 是否正确')
      console.error('Identify game failed:', error)
    } finally {
      setIsIdentifying(false)
    }
  }

  const loadSearchResults = async (page: number) => {
    const keyword = gameName.trim()
    if (!keyword) {
      return
    }

    setIsSearching(true)
    try {
      const nextOffset = (page - 1) * pageSize
      const result = await searchGameByNameApi(keyword, provider, nextOffset, pageSize)
      setSearchResults(result.items)
      setSearchTotal(result.total)
      setSearchPage(page)
      setSearchResultDialogOpen(true)
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearchResultDialog = () => {
    setSearchResults([])
    setSearchTotal(0)
    setSearchPage(1)
    setSearchResultDialogOpen(false)
  }

  const handleSearchByName = async () => {
    await loadSearchResults(1)
  }

  const handleSelectSearchItem = (item: GameSearchItem) => {
    setGameId(item.id)
    clearSearchResultDialog()
  }

  const handleFormValueChange = (field: keyof GameInfoFormValues, value: string) => {
    setEditableGameInfo((prev) => {
      if (prev === null) {
        return prev
      }
      return {
        ...prev,
        [field]: value,
      }
    })
  }

  const handleConfirm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (gameInfo === null || editableGameInfo === null) {
      return
    }

    const nextGameInfo: GameInfo = {
      ...gameInfo,
      name: editableGameInfo.name,
      nameCn: editableGameInfo.nameCn,
      date: editableGameInfo.date,
      cover: editableGameInfo.cover,
      summary: editableGameInfo.summary,
      tags: editableGameInfo.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      developer: editableGameInfo.developer,
      publisher: editableGameInfo.publisher,
    }

    setIsSaving(true)
    try {
      const result = await createGameInfoApi(nextGameInfo, {
        provider,
        externalId: gameId.trim(),
      })
      setGameInfo(nextGameInfo)
      setEditDialogOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['game'] })
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      router.refresh()
      toast.success('添加成功')
      console.log('Saved Game ID:', result?.data?.id)
      console.log('Edited Game Info:', nextGameInfo)
    } catch (error) {
      toast.error('添加失败，请稍后重试')
      console.error('Save game failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(searchTotal / pageSize))

  return (
    <>
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="min-w-16">数据来源</div>
              {lockProvider ? (
                <div className="text-sm font-medium">
                  {providerOptions.find((option) => option.value === provider)?.label ?? provider}
                </div>
              ) : (
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="min-w-32">
                    <SelectValue defaultValue={provider} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {providerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="min-w-16">游戏名称</div>
              <Input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} />
              <Button
                type="button"
                variant="outline"
                disabled={isSearching || gameName.trim().length === 0}
                onClick={handleSearchByName}
              >
                {isSearching ? '搜索中...' : '搜索'}
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="min-w-16">游戏 ID</div>
              <Input type="text" value={gameId} onChange={(e) => setGameId(e.target.value)} />
              <Button
                type="button"
                variant="outline"
                disabled={isIdentifying || gameId.trim().length === 0}
                onClick={handleSearchById}
              >
                {isIdentifying ? '识别中...' : '识别'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={searchResultDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setSearchResultDialogOpen(true)
            return
          }
          clearSearchResultDialog()
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>搜索结果</DialogTitle>
            <DialogDescription>每页 10 条，选择后自动回填游戏 ID</DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className="text-muted-foreground hidden grid-cols-[2fr_1fr_1fr_auto] gap-2 px-2 text-sm sm:grid">
              <div>游戏名</div>
              <div>开发商</div>
              <div>发行日期</div>
              <div className="text-right">操作</div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-muted-foreground rounded-md border p-4 text-sm">
                  未找到匹配记录
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="grid items-center gap-2 rounded-md border p-2 sm:grid-cols-[2fr_1fr_1fr_auto]"
                  >
                    <div className="truncate text-sm font-medium">{item.name || '-'}</div>
                    <div className="text-muted-foreground truncate text-xs sm:text-sm">
                      {item.developer || '-'}
                    </div>
                    <div className="text-muted-foreground truncate text-xs sm:text-sm">
                      {item.date || '-'}
                    </div>
                    <div className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectSearchItem(item)}
                      >
                        选择
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

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
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>编辑游戏信息</DialogTitle>
            <DialogDescription>识别成功后可在此修改部分字段</DialogDescription>
          </DialogHeader>

          {editableGameInfo !== null && (
            <form className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={handleConfirm}>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <div className="space-y-2">
                  <div className="text-sm">游戏名称</div>
                  <Input
                    value={editableGameInfo.name}
                    onChange={(e) => handleFormValueChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm">中文名称</div>
                  <Input
                    value={editableGameInfo.nameCn}
                    onChange={(e) => handleFormValueChange('nameCn', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm">发布日期</div>
                  <Input
                    value={editableGameInfo.date}
                    onChange={(e) => handleFormValueChange('date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm">封面链接</div>
                  <Input
                    value={editableGameInfo.cover}
                    onChange={(e) => handleFormValueChange('cover', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm">标签（逗号分隔）</div>
                  <Input
                    value={editableGameInfo.tags}
                    onChange={(e) => handleFormValueChange('tags', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm">开发商</div>
                  <Input
                    value={editableGameInfo.developer}
                    onChange={(e) => handleFormValueChange('developer', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm">发行商</div>
                  <Input
                    value={editableGameInfo.publisher}
                    onChange={(e) => handleFormValueChange('publisher', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm">简介</div>
                  <Textarea
                    value={editableGameInfo.summary}
                    onChange={(e) => handleFormValueChange('summary', e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setEditDialogOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? '保存中...' : '确定'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
