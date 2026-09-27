import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  importSteamGameApi,
  searchSteamOwnedGamesApi,
  type SteamOwnedGameItem,
} from '@/features/game/import-api'
import { getThirdPartyAccounts } from '@/lib/cloud-sync-utils'

import type { GameImportDialogProps } from './types'

export const SteamImportDialog = ({ children }: GameImportDialogProps) => {
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
    accountData?.items.find((item) => item.provider.toLowerCase() === 'steam') ?? null

  useEffect(() => {
    if (!open) {
      return
    }

    if (!steamUid.trim() && boundSteamAccount?.accountId) {
      setSteamUid(boundSteamAccount.accountId)
    }
  }, [boundSteamAccount?.accountId, open, steamUid])

  const selectedCount = steamResults.filter((item) => item.selected).length
  const importedCount = steamResults.filter((item) => item.status === 'imported').length
  const skippedCount = steamResults.filter((item) => item.status === 'skipped').length
  const failedCount = steamResults.filter((item) => item.status === 'failed').length
  const visibleSteamResults = showOnlyNotImported
    ? steamResults.filter((item) => item.status !== 'imported' && item.status !== 'skipped')
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
            item.appid === target.appid ? { ...item, status: 'importing', reason: '' } : item,
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
                  disabled={isSearching || isImporting || steamUid.trim().length === 0}
                  onClick={handleSearch}
                >
                  {isSearching ? '搜索中...' : '搜索'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">
                共 {steamResults.length} 项，已选 {selectedCount} 项，新增 {importedCount}{' '}
                项，已存在 {skippedCount} 项，失败 {failedCount} 项
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
                          isImporting || item.status === 'imported' || item.status === 'skipped'
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
                      <div className="truncate">{formatPlaytime(item.playtimeMinutes)}</div>
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
