import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
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
import { getThirdPartyAccounts } from '@/lib/cloud-sync-utils'
import { getManualSearchProviderOptions } from '@/lib/providers'
import {
  createGameInfoApi,
  getGameInfoByIdApi,
  importSteamGameApi,
  searchBangumiCollectedGamesApi,
  searchGameByNameApi,
  searchSteamOwnedGamesApi,
  searchVndbUserListApi,
  searchYmgalUserGamesApi,
  type ThirdPartyLibraryGameItem,
  type SteamOwnedGameItem,
  type GameSearchItem,
} from '@/lib/vndb-utils'
import { GameInfo } from '@/types/game-types'

type VNDBSearchDialogProps = {
  children: ReactNode
  initialProvider?: string
  lockProvider?: boolean
  dialogTitle?: string
  dialogDescription?: string
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

export const VNDBSearchDialog = ({
  children,
  initialProvider,
  lockProvider = false,
  dialogTitle = '添加游戏',
  dialogDescription = '从游戏数据库中导入',
}: VNDBSearchDialogProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const pageSize = 10
  const [gameName, setGameName] = useState<string>('')
  const [gameId, setGameId] = useState<string>('')
  const providerOptions = getManualSearchProviderOptions()
  const defaultProvider =
    initialProvider ?? providerOptions[0]?.value ?? 'bangumi'
  const [provider, setProvider] = useState<string>(defaultProvider)
  const [searchDialogOpen, setSearchDialogOpen] = useState<boolean>(false)
  const [searchResultDialogOpen, setSearchResultDialogOpen] =
    useState<boolean>(false)
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [searchPage, setSearchPage] = useState<number>(1)
  const [searchTotal, setSearchTotal] = useState<number>(0)
  const [searchResults, setSearchResults] = useState<GameSearchItem[]>([])
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null)
  const [editableGameInfo, setEditableGameInfo] =
    useState<GameInfoFormValues | null>(null)

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
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="min-w-16">数据来源</div>
              {lockProvider ? (
                <div className="text-sm font-medium">
                  {providerOptions.find((option) => option.value === provider)
                    ?.label ?? provider}
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
            <DialogDescription>
              每页 10 条，选择后自动回填游戏 ID
            </DialogDescription>
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
                    <div className="truncate text-sm font-medium">
                      {item.name || '-'}
                    </div>
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
            <form
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
              onSubmit={handleConfirm}
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
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

  const { data: accountData } = useQuery({
    queryKey: ['third-party-accounts'],
    queryFn: getThirdPartyAccounts,
  })

  const boundSteamAccount =
    accountData?.items.find(
      (item) => item.provider.toLowerCase() === 'steam',
    ) ?? null

  useEffect(() => {
    if (!open) {
      return
    }

    if (!steamUid.trim() && boundSteamAccount?.accountId) {
      setSteamUid(boundSteamAccount.accountId)
    }
  }, [boundSteamAccount?.accountId, open, steamUid])

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
        <DialogContent className="flex max-h-[85vh] flex-col">
          <DialogHeader>
            <DialogTitle>从 Steam 导入</DialogTitle>
            <DialogDescription>
              先搜索 Steam 游戏库，再勾选并导入；会同时导入游玩时长。
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <div className="text-sm">Steam UID</div>
              {boundSteamAccount ? (
                <div className="text-muted-foreground text-xs">
                  已自动使用已绑定 Steam 账号：{boundSteamAccount.accountId}
                </div>
              ) : null}
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

type ProviderCollectionImportDialogProps = {
  children: ReactNode
  provider: 'bangumi' | 'vndb' | 'ymgal'
  title: string
  description: string
}

const ProviderCollectionImportDialog = ({
  children,
  provider,
  title,
  description,
}: ProviderCollectionImportDialogProps) => {
  const IMPORT_CONCURRENCY = 4
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showOnlyNotImported, setShowOnlyNotImported] = useState(false)
  const [items, setItems] = useState<
    Array<
      ThirdPartyLibraryGameItem & {
        selected: boolean
        status: 'idle' | 'importing' | 'imported' | 'skipped' | 'failed'
        reason: string
      }
    >
  >([])

  const { data: accountData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['third-party-accounts'],
    queryFn: getThirdPartyAccounts,
  })

  const account =
    accountData?.items.find(
      (item) => item.provider.toLowerCase() === provider,
    ) ?? null

  const selectedCount = items.filter((item) => item.selected).length
  const importedCount = items.filter(
    (item) => item.status === 'imported',
  ).length
  const skippedCount = items.filter((item) => item.status === 'skipped').length
  const failedCount = items.filter((item) => item.status === 'failed').length
  const visibleItems = showOnlyNotImported
    ? items.filter(
        (item) => item.status !== 'imported' && item.status !== 'skipped',
      )
    : items

  const handleSearch = async () => {
    if (!account) {
      const providerLabel =
        provider === 'bangumi'
          ? ' Bangumi '
          : provider === 'ymgal'
            ? ' YMGal '
            : ' VNDB '
      toast.error(`请先绑定${providerLabel}账号`)
      return
    }

    setIsSearching(true)
    try {
      let result
      if (provider === 'bangumi') {
        result = await searchBangumiCollectedGamesApi()
      } else if (provider === 'ymgal') {
        result = await searchYmgalUserGamesApi()
      } else {
        result = await searchVndbUserListApi()
      }

      const rows = result.data.items.map((item) => ({
        ...item,
        selected: !item.alreadyImported,
        status: item.alreadyImported ? ('skipped' as const) : ('idle' as const),
        reason: item.alreadyImported ? '已存在于库中' : '',
      }))

      setItems(rows)
      toast.success(`已获取 ${rows.length} 条记录，请勾选需要导入的条目`)
    } catch (error) {
      toast.error(`${title}列表读取失败，请稍后重试`)
      console.error(`${provider} import search failed:`, error)
    } finally {
      setIsSearching(false)
    }
  }

  const setAllSelectable = (selected: boolean) => {
    setItems((prev) =>
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

  const handleToggleSelect = (id: string, selected: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected } : item)),
    )
  }

  const handleImport = async () => {
    const targets = items.filter(
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
        setItems((prev) =>
          prev.map((item) =>
            item.id === target.id
              ? { ...item, status: 'importing', reason: '' }
              : item,
          ),
        )

        try {
          const gameInfo = await getGameInfoByIdApi(target.id, provider)
          if (!gameInfo) {
            throw new Error('未获取到游戏详情')
          }

          await createGameInfoApi(gameInfo, {
            provider,
            externalId: target.id,
          })

          setItems((prev) =>
            prev.map((item) =>
              item.id === target.id
                ? {
                    ...item,
                    selected: false,
                    status: 'imported',
                    reason: '',
                  }
                : item,
            ),
          )
        } catch (error) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === target.id
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
      toast.error(`${title}导入失败，请稍后重试`)
      console.error(`${provider} import failed:`, error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="flex max-h-[85vh] flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <div className="text-sm">已绑定账号</div>
              {isLoadingAccounts ? (
                <div className="text-muted-foreground text-sm">
                  账号加载中...
                </div>
              ) : account ? (
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium">
                    {account.profile?.displayName || account.accountId}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    账号 ID：{account.accountId}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground rounded-md border p-3 text-sm">
                  请先在设置页绑定
                  {provider === 'bangumi'
                    ? ' Bangumi '
                    : provider === 'ymgal'
                      ? ' YMGal '
                      : ' VNDB '}
                  账号。
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSearching || isImporting || !account}
                  onClick={handleSearch}
                >
                  {isSearching ? '读取中...' : '读取已绑定账号列表'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">
                共 {items.length} 项，已选 {selectedCount} 项，新增{' '}
                {importedCount} 项，已存在 {skippedCount} 项，失败 {failedCount}{' '}
                项
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isImporting || items.length === 0}
                  onClick={() => setAllSelectable(true)}
                >
                  全选可导入
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isImporting || items.length === 0}
                  onClick={() => setAllSelectable(false)}
                >
                  取消全选
                </Button>
                <div className="ml-auto flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">仅显示未导入</span>
                  <Switch
                    checked={showOnlyNotImported}
                    disabled={isImporting || items.length === 0}
                    onCheckedChange={setShowOnlyNotImported}
                  />
                </div>
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {visibleItems.length === 0 ? (
                  <div className="text-muted-foreground rounded-md border p-4 text-sm">
                    {items.length === 0
                      ? '请先读取已绑定账号的游戏列表。'
                      : '当前筛选下没有可显示的游戏。'}
                  </div>
                ) : (
                  visibleItems.map((item) => (
                    <div
                      key={item.id}
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
                          handleToggleSelect(item.id, Boolean(checked))
                        }
                      />
                      <div className="size-8 overflow-hidden rounded border">
                        <img
                          src={item.coverUrl || '/file.svg'}
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
                      <div className="min-w-0">
                        <div className="truncate">{item.name}</div>
                        <div className="text-muted-foreground truncate text-xs">
                          {item.note || item.id}
                        </div>
                      </div>
                      <div className="truncate">{item.date || '-'}</div>
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

export const BangumiImportDialog = ({ children }: VNDBSearchDialogProps) => {
  return (
    <ProviderCollectionImportDialog
      provider="bangumi"
      title="从 Bangumi 导入"
      description="必须先绑定 Bangumi 账号，然后从该账号的游戏收藏中导入。"
    >
      {children}
    </ProviderCollectionImportDialog>
  )
}

export const VndbImportDialog = ({ children }: VNDBSearchDialogProps) => {
  return (
    <ProviderCollectionImportDialog
      provider="vndb"
      title="从 VNDB 导入"
      description="必须先绑定 VNDB 账号，然后从 My Visual Novel List 中导入。"
    >
      {children}
    </ProviderCollectionImportDialog>
  )
}

export const YmgalImportDialog = ({ children }: VNDBSearchDialogProps) => {
  return (
    <ProviderCollectionImportDialog
      provider="ymgal"
      title="从 YMGal 导入"
      description="必须先绑定 YMGal 账号，然后从用户的游戏列表中导入。"
    >
      {children}
    </ProviderCollectionImportDialog>
  )
}
