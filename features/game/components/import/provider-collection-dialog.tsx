import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  createGameInfoApi,
  getGameInfoByIdApi,
  searchBangumiCollectedGamesApi,
  searchVndbUserListApi,
  searchYmgalUserGamesApi,
  type ThirdPartyLibraryGameItem,
} from '@/features/game/import-api'
import { getThirdPartyAccounts } from '@/lib/cloud-sync-utils'

type ProviderCollectionImportDialogProps = {
  children: ReactNode
  provider: 'bangumi' | 'vndb' | 'ymgal'
  title: string
  description: string
}

export const ProviderCollectionImportDialog = ({
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
    accountData?.items.find((item) => item.provider.toLowerCase() === provider) ?? null

  const selectedCount = items.filter((item) => item.selected).length
  const importedCount = items.filter((item) => item.status === 'imported').length
  const skippedCount = items.filter((item) => item.status === 'skipped').length
  const failedCount = items.filter((item) => item.status === 'failed').length
  const visibleItems = showOnlyNotImported
    ? items.filter((item) => item.status !== 'imported' && item.status !== 'skipped')
    : items

  const handleSearch = async () => {
    if (!account) {
      const providerLabel =
        provider === 'bangumi' ? ' Bangumi ' : provider === 'ymgal' ? ' YMGal ' : ' VNDB '
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
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected } : item)))
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
            item.id === target.id ? { ...item, status: 'importing', reason: '' } : item,
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
                <div className="text-muted-foreground text-sm">账号加载中...</div>
              ) : account ? (
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium">
                    {account.profile?.displayName || account.accountId}
                  </div>
                  <div className="text-muted-foreground text-xs">账号 ID：{account.accountId}</div>
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
                共 {items.length} 项，已选 {selectedCount} 项，新增 {importedCount} 项，已存在{' '}
                {skippedCount} 项，失败 {failedCount} 项
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
                          isImporting || item.status === 'imported' || item.status === 'skipped'
                        }
                        onCheckedChange={(checked) => handleToggleSelect(item.id, Boolean(checked))}
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
                        {item.status === 'failed' && `失败：${item.reason || '未知错误'}`}
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
