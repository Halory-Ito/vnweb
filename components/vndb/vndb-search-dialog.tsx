import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_GAME_PROVIDER,
  GAME_PROVIDER_OPTIONS,
} from '@/lib/provider-options'
import {
  createGameInfoApi,
  getGameInfoByIdApi,
  importSteamGameApi,
  searchGameByNameApi,
  searchSteamOwnedGamesApi,
  type SteamOwnedGameItem,
  type GameSearchItem,
} from '@/lib/vndb-utils'
import { GameInfo } from '@/types/game-types'

type VNDBSearchDialogProps = {
  children: ReactNode
}

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

const MANUAL_ADD_ENABLED_PROVIDER_SET = new Set([
  'bangumi',
  'steamgriddb',
  'steam',
])

export const VNDBSearchDialog = ({ children }: VNDBSearchDialogProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const pageSize = 10
  const [gameName, setGameName] = useState<string>('')
  const [gameId, setGameId] = useState<string>('')
  const [provider, setProvider] = useState<string>(DEFAULT_GAME_PROVIDER)
  const [searchDialogOpen, setSearchDialogOpen] = useState<boolean>(false)
  const [searchResultDialogOpen, setSearchResultDialogOpen] =
    useState<boolean>(false)
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [searchPage, setSearchPage] = useState<number>(1)
  const [searchTotal, setSearchTotal] = useState<number>(0)
  const [searchResults, setSearchResults] = useState<GameSearchItem[]>([])
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null)
  const [editableGameInfo, setEditableGameInfo] =
    useState<GameInfoFormValues | null>(null)

  const selectableProviderOptions = GAME_PROVIDER_OPTIONS.map((option) => {
    const disabled = !MANUAL_ADD_ENABLED_PROVIDER_SET.has(option.value)
    return {
      ...option,
      disabled,
      label: disabled ? `${option.label}（暂未实现）` : option.label,
    }
  })

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
    const res = await getGameInfoByIdApi(gameId, provider)
    if (res === null) {
      return
    }

    setGameInfo(res)
    setEditableGameInfo(toFormValues(res))
    setSearchDialogOpen(false)
    setEditDialogOpen(true)
  }

  const loadSearchResults = async (page: number) => {
    const keyword = gameName.trim()
    if (!keyword) {
      return
    }

    setIsSearching(true)
    try {
      const nextOffset = (page - 1) * pageSize
      const result = await searchGameByNameApi(
        keyword,
        provider,
        nextOffset,
        pageSize,
      )
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

  const handleFormValueChange = (
    field: keyof GameInfoFormValues,
    value: string,
  ) => {
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
            <DialogTitle>添加游戏</DialogTitle>
            <DialogDescription>从游戏数据库中导入</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="min-w-16">数据来源</div>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="min-w-32">
                  <SelectValue defaultValue={provider} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {selectableProviderOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-4">
              <div className="min-w-16">游戏名称</div>
              <Input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
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
              <Input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearchById}
              >
                识别
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>搜索结果</DialogTitle>
            <DialogDescription>
              每页 10 条，选择后自动回填游戏 ID
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-muted-foreground grid grid-cols-[2fr_1fr_1fr_auto] gap-2 px-2 text-sm">
              <div>游戏名</div>
              <div>开发商</div>
              <div>发行日期</div>
              <div className="text-right">操作</div>
            </div>

            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-muted-foreground rounded-md border p-4 text-sm">
                  未找到匹配记录
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-2 rounded-md border p-2"
                  >
                    <div className="truncate">{item.name || '-'}</div>
                    <div className="truncate">{item.developer || '-'}</div>
                    <div className="truncate">{item.date || '-'}</div>
                    <div className="text-right">
                      <Button
                        type="button"
                        variant="outline"
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>编辑游戏信息</DialogTitle>
            <DialogDescription>识别成功后可在此修改部分字段</DialogDescription>
          </DialogHeader>

          {editableGameInfo !== null && (
            <form className="space-y-4" onSubmit={handleConfirm}>
              <div className="space-y-2">
                <div className="text-sm">游戏名称</div>
                <Input
                  value={editableGameInfo.name}
                  onChange={(e) =>
                    handleFormValueChange('name', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm">中文名称</div>
                <Input
                  value={editableGameInfo.nameCn}
                  onChange={(e) =>
                    handleFormValueChange('nameCn', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm">发布日期</div>
                <Input
                  value={editableGameInfo.date}
                  onChange={(e) =>
                    handleFormValueChange('date', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm">封面链接</div>
                <Input
                  value={editableGameInfo.cover}
                  onChange={(e) =>
                    handleFormValueChange('cover', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm">标签（逗号分隔）</div>
                <Input
                  value={editableGameInfo.tags}
                  onChange={(e) =>
                    handleFormValueChange('tags', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm">开发商</div>
                <Input
                  value={editableGameInfo.developer}
                  onChange={(e) =>
                    handleFormValueChange('developer', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm">发行商</div>
                <Input
                  value={editableGameInfo.publisher}
                  onChange={(e) =>
                    handleFormValueChange('publisher', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm">简介</div>
                <Textarea
                  value={editableGameInfo.summary}
                  onChange={(e) =>
                    handleFormValueChange('summary', e.target.value)
                  }
                />
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

export const SteamImportDialog = ({ children }: VNDBSearchDialogProps) => {
  const IMPORT_CONCURRENCY = 4
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState<boolean>(false)
  const [steamUid, setSteamUid] = useState<string>('')
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [showOnlyNotImported, setShowOnlyNotImported] = useState<boolean>(false)
  const [steamResults, setSteamResults] = useState<
    Array<
      SteamOwnedGameItem & {
        selected: boolean
        status: 'idle' | 'importing' | 'imported' | 'skipped' | 'failed'
        reason: string
      }
    >
  >([])

  const selectedCount = steamResults.filter((item) => item.selected).length
  const importedCount = steamResults.filter(
    (item) => item.status === 'imported',
  ).length
  const skippedCount = steamResults.filter(
    (item) => item.status === 'skipped',
  ).length
  const failedCount = steamResults.filter(
    (item) => item.status === 'failed',
  ).length
  const visibleSteamResults = showOnlyNotImported
    ? steamResults.filter(
        (item) => item.status !== 'imported' && item.status !== 'skipped',
      )
    : steamResults

  const formatPlaytime = (minutes: number) => {
    const hours = minutes / 60
    return `${hours.toFixed(1)} 小时`
  }

  const handleSearch = async () => {
    const uid = steamUid.trim()
    if (!/^\d{17}$/.test(uid)) {
      toast.error('请输入有效的 Steam UID（17 位数字）')
      return
    }

    setIsSearching(true)
    try {
      const result = await searchSteamOwnedGamesApi(uid)
      const rows = result.data.items.map((item) => ({
        ...item,
        selected: !item.alreadyImported,
        status: item.alreadyImported ? ('skipped' as const) : ('idle' as const),
        reason: item.alreadyImported ? '已存在于库中' : '',
      }))

      setSteamResults(rows)
      toast.success(`已获取 ${rows.length} 款游戏，请勾选需要导入的条目`)
    } catch (error) {
      toast.error('Steam 搜索失败，请稍后重试')
      console.error('Steam search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const setAllSelectable = (selected: boolean) => {
    setSteamResults((prev) =>
      prev.map((item) => {
        if (item.status === 'imported' || item.status === 'skipped') {
          return item
        }

        return {
          ...item,
          selected,
        }
      }),
    )
  }

  const handleToggleSelect = (appid: number, selected: boolean) => {
    setSteamResults((prev) =>
      prev.map((item) =>
        item.appid === appid
          ? {
              ...item,
              selected,
            }
          : item,
      ),
    )
  }

  const handleImport = async () => {
    const uid = steamUid.trim()
    const targets = steamResults.filter(
      (item) =>
        item.selected &&
        item.status !== 'imported' &&
        item.status !== 'skipped' &&
        item.status !== 'importing',
    )

    if (targets.length === 0) {
      toast.error('请先勾选需要导入的游戏')
      return
    }

    setIsImporting(true)
    try {
      let cursor = 0

      const importOne = async (target: (typeof targets)[number]) => {
        setSteamResults((prev) =>
          prev.map((item) =>
            item.appid === target.appid
              ? { ...item, status: 'importing', reason: '' }
              : item,
          ),
        )

        try {
          const result = await importSteamGameApi({
            steamId: uid,
            appid: target.appid,
            name: target.name,
            playtimeMinutes: target.playtimeMinutes,
            coverUrl: target.coverUrl,
            iconUrl: target.iconUrl,
            logoUrl: target.logoUrl,
          })

          const status = result.data.status
          setSteamResults((prev) =>
            prev.map((item) => {
              if (item.appid !== target.appid) {
                return item
              }

              return {
                ...item,
                selected: false,
                status,
                reason: result.data.reason ?? '',
              }
            }),
          )
        } catch (error) {
          setSteamResults((prev) =>
            prev.map((item) =>
              item.appid === target.appid
                ? {
                    ...item,
                    status: 'failed',
                    reason: (error as Error).message || '导入失败',
                  }
                : item,
            ),
          )
        }
      }

      const workerCount = Math.min(IMPORT_CONCURRENCY, targets.length)
      const workers = Array.from({ length: workerCount }, async () => {
        while (true) {
          const currentIndex = cursor
          cursor += 1

          const target = targets[currentIndex]
          if (!target) {
            return
          }

          await importOne(target)
        }
      })

      await Promise.all(workers)

      await queryClient.invalidateQueries({ queryKey: ['game'] })
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      router.refresh()
      toast.success('已完成所选游戏导入')
    } catch (error) {
      toast.error('Steam 导入失败，请稍后重试')
      console.error('Steam import failed:', error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>从 Steam 导入</DialogTitle>
            <DialogDescription>
              先搜索 Steam 游戏库，再勾选并导入；会同时导入游玩时长。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm">Steam UID</div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="例如：7656119xxxxxxxxxx"
                  value={steamUid}
                  onChange={(e) => setSteamUid(e.target.value)}
                  disabled={isSearching || isImporting}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    isSearching || isImporting || steamUid.trim().length === 0
                  }
                  onClick={handleSearch}
                >
                  {isSearching ? '搜索中...' : '搜索'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">
                共 {steamResults.length} 项，已选 {selectedCount} 项，新增{' '}
                {importedCount} 项，已存在 {skippedCount} 项，失败 {failedCount}{' '}
                项
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isImporting || steamResults.length === 0}
                  onClick={() => setAllSelectable(true)}
                >
                  全选可导入
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isImporting || steamResults.length === 0}
                  onClick={() => setAllSelectable(false)}
                >
                  取消全选
                </Button>
                <div className="ml-auto flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">仅显示未导入</span>
                  <Switch
                    checked={showOnlyNotImported}
                    disabled={isImporting || steamResults.length === 0}
                    onCheckedChange={setShowOnlyNotImported}
                  />
                </div>
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {visibleSteamResults.length === 0 ? (
                  <div className="text-muted-foreground rounded-md border p-4 text-sm">
                    {steamResults.length === 0
                      ? '请先输入 UID 并搜索。'
                      : '当前筛选下没有可显示的游戏。'}
                  </div>
                ) : (
                  visibleSteamResults.map((item) => (
                    <div
                      key={item.appid}
                      className="grid grid-cols-[auto_auto_2fr_1fr_1fr] items-center gap-2 rounded-md border p-2 text-sm"
                    >
                      <Checkbox
                        checked={item.selected}
                        disabled={
                          isImporting ||
                          item.status === 'imported' ||
                          item.status === 'skipped'
                        }
                        onCheckedChange={(checked) =>
                          handleToggleSelect(item.appid, Boolean(checked))
                        }
                      />
                      <div className="size-8 overflow-hidden rounded border">
                        <img
                          src={item.iconUrl || '/file.svg'}
                          alt={item.name}
                          className="size-full object-cover"
                          loading="lazy"
                          onError={(event) => {
                            const target = event.currentTarget
                            target.onerror = null
                            target.src = '/file.svg'
                          }}
                        />
                      </div>
                      <div className="truncate">{item.name}</div>
                      <div className="truncate">
                        {formatPlaytime(item.playtimeMinutes)}
                      </div>
                      <div className="truncate">
                        {item.status === 'idle' && '待导入'}
                        {item.status === 'importing' && '导入中...'}
                        {item.status === 'imported' && '已导入'}
                        {item.status === 'skipped' && '已存在'}
                        {item.status === 'failed' &&
                          `失败：${item.reason || '未知错误'}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isImporting}
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={isSearching || isImporting || selectedCount === 0}
              onClick={handleImport}
            >
              {isImporting ? '导入中...' : '导入已勾选游戏'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
