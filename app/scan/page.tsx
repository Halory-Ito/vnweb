'use client'

import {
  FolderIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getGameCardList } from '@/lib/game-utils'
import {
  DEFAULT_GAME_PROVIDER,
  GAME_PROVIDER_OPTIONS,
} from '@/lib/provider-options'
import {
  createScanner,
  deleteScannerById,
  getScanErrors,
  getScannerList,
  type ScanErrorItem,
  startScannerById,
  updateScannerById,
} from '@/lib/scan-utils'

type ScanDirectoryItem = {
  id: number
  path: string
  sourceName: string
  progress: number
  gameCount: number
  scanMode: number
  scanLevel: number
  status: string
}

const ScanDirectoryRow = ({
  item,
  onStart,
  onEdit,
  onDelete,
  isScanning,
}: {
  item: ScanDirectoryItem
  onStart: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  isScanning: boolean
}) => (
  <div className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      <FolderIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{item.path}</div>
        <div className="text-muted-foreground text-xs">
          <span>{item.sourceName}</span>
          <span> · </span>
          <span>
            {item.scanMode === 0
              ? `层级扫描（层级 ${item.scanLevel}）`
              : '可执行文件扫描'}
          </span>
          <span> · </span>
          <span>完成度 {item.progress}%</span>
          <span> · </span>
          <span>游戏 {item.gameCount}</span>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="hover:bg-accent hover:text-accent-foreground px-3 py-1 text-sm"
      >
        {item.status}
      </Badge>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={isScanning}
        onClick={() => onStart(item.id)}
        aria-label="开始扫描"
      >
        <PlayIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={isScanning}
        onClick={() => onEdit(item.id)}
        aria-label="修改目录"
      >
        <PencilIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={isScanning}
        onClick={() => onDelete(item.id)}
        aria-label="删除目录"
      >
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  </div>
)

export default function Scan() {
  const [progress, setProgress] = useState(0)
  const [failedItems, setFailedItems] = useState<ScanErrorItem[]>([])
  const [scanDirectories, setScanDirectories] = useState<ScanDirectoryItem[]>(
    [],
  )
  const [isLoadingScanners, setIsLoadingScanners] = useState(false)

  const [failedDialogOpen, setFailedDialogOpen] = useState(false)
  const [globalSettingOpen, setGlobalSettingOpen] = useState(false)
  const [addDirectoryOpen, setAddDirectoryOpen] = useState(false)
  const [editDirectoryId, setEditDirectoryId] = useState<number | null>(null)

  const [excludePathInput, setExcludePathInput] = useState('')
  const [excludePaths, setExcludePaths] = useState<string[]>([])

  const [directoryPathInput, setDirectoryPathInput] = useState('')
  const [directoryProviderInput, setDirectoryProviderInput] = useState(
    DEFAULT_GAME_PROVIDER,
  )
  const [directoryScanModeInput, setDirectoryScanModeInput] = useState('0')
  const [directoryScanLevelInput, setDirectoryScanLevelInput] = useState('0')
  const [isSavingDirectory, setIsSavingDirectory] = useState(false)
  const [isLoadingErrors, setIsLoadingErrors] = useState(false)
  const [isScanningAll, setIsScanningAll] = useState(false)
  const [scanningDirectoryIds, setScanningDirectoryIds] = useState<number[]>([])
  const [totalGameCount, setTotalGameCount] = useState(0)

  const scannerCount = scanDirectories.length

  const editingDirectory = useMemo(
    () => scanDirectories.find((item) => item.id === editDirectoryId) ?? null,
    [editDirectoryId, scanDirectories],
  )

  const loadScanners = async () => {
    setIsLoadingScanners(true)
    try {
      const data = await getScannerList()
      const mapped = data.map((item) => {
        const progressValue = item.progress ?? 0
        return {
          id: item.id,
          path: item.directory,
          sourceName: item.provider,
          progress: progressValue,
          gameCount: item.gameCount ?? 0,
          scanMode: item.scanMode ?? 0,
          scanLevel: item.scanLevel ?? 0,
          status:
            progressValue >= 100
              ? '已完成'
              : progressValue > 0
                ? '扫描中'
                : '未开始',
        }
      })
      setScanDirectories((prev) => {
        const prevMap = new Map(prev.map((item) => [item.id, item]))
        const next = mapped.map((item) => {
          const oldItem = prevMap.get(item.id)
          if (!oldItem) {
            return item
          }

          const isSame =
            oldItem.path === item.path &&
            oldItem.sourceName === item.sourceName &&
            oldItem.progress === item.progress &&
            oldItem.gameCount === item.gameCount &&
            oldItem.scanMode === item.scanMode &&
            oldItem.scanLevel === item.scanLevel &&
            oldItem.status === item.status

          return isSame ? oldItem : item
        })
        return next
      })
      const totalWeight = mapped.reduce(
        (sum, item) => sum + Math.max(item.gameCount, 1),
        0,
      )
      const weightedProgress =
        totalWeight === 0
          ? 0
          : Math.floor(
              mapped.reduce(
                (sum, item) =>
                  sum + item.progress * Math.max(item.gameCount, 1),
                0,
              ) / totalWeight,
            )
      setProgress(weightedProgress)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || '加载扫描目录失败',
      )
    } finally {
      setIsLoadingScanners(false)
    }
  }

  const loadScanErrors = async () => {
    setIsLoadingErrors(true)
    try {
      const data = await getScanErrors()
      setFailedItems(data)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || '加载失败列表失败',
      )
    } finally {
      setIsLoadingErrors(false)
    }
  }

  const loadGameCount = async () => {
    try {
      const gameCards = await getGameCardList()
      setTotalGameCount(gameCards.length)
    } catch {
      setTotalGameCount(0)
    }
  }

  useEffect(() => {
    void loadScanners()
    void loadScanErrors()
    void loadGameCount()
  }, [])

  const handleAddExcludePath = () => {
    const nextPath = excludePathInput.trim()
    if (!nextPath) {
      return
    }
    setExcludePaths((prev) => Array.from(new Set([...prev, nextPath])))
    setExcludePathInput('')
  }

  const handleRemoveExcludePath = (path: string) => {
    setExcludePaths((prev) => prev.filter((item) => item !== path))
  }

  const handleScanAll = async () => {
    if (scanDirectories.length === 0) {
      return
    }

    setIsScanningAll(true)
    setScanningDirectoryIds(scanDirectories.map((item) => item.id))

    const timer = window.setInterval(() => {
      void loadScanners()
    }, 800)

    try {
      await Promise.all(
        scanDirectories.map((item) => startScannerById(item.id)),
      )
      await loadScanners()
      await loadScanErrors()
      await loadGameCount()
      toast.success('全部扫描完成')
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '批量扫描失败')
    } finally {
      window.clearInterval(timer)
      setIsScanningAll(false)
      setScanningDirectoryIds([])
    }
  }

  const handleStartScan = async (id: number) => {
    setScanningDirectoryIds((prev) => [...prev, id])
    const timer = window.setInterval(() => {
      void loadScanners()
    }, 800)

    try {
      const result = await startScannerById(id)
      await loadScanners()
      await loadScanErrors()
      await loadGameCount()
      toast.success(
        `扫描完成：共 ${result.data.scannedCount} 个，新增 ${result.data.addedCount} 个`,
      )
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '扫描失败')
    } finally {
      window.clearInterval(timer)
      setScanningDirectoryIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleDeleteDirectory = async (id: number) => {
    try {
      await deleteScannerById(id)
      setScanDirectories((prev) => prev.filter((item) => item.id !== id))
      toast.success('已删除扫描目录')
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除失败')
    }
  }

  const handleOpenAddDialog = () => {
    setDirectoryPathInput('')
    setDirectoryProviderInput(DEFAULT_GAME_PROVIDER)
    setDirectoryScanModeInput('0')
    setDirectoryScanLevelInput('0')
    setAddDirectoryOpen(true)
  }

  const handleAddDirectory = async () => {
    const nextPath = directoryPathInput.trim()
    const nextProvider = directoryProviderInput.trim() || DEFAULT_GAME_PROVIDER
    const nextScanMode = Number(directoryScanModeInput)
    const nextScanLevel = Number(directoryScanLevelInput)
    if (!nextPath) {
      toast.error('请填写扫描目录路径')
      return
    }

    if (!Number.isInteger(nextScanLevel) || nextScanLevel < 0) {
      toast.error('扫描层级需为大于等于 0 的整数')
      return
    }

    setIsSavingDirectory(true)
    try {
      const created = await createScanner({
        directory: nextPath,
        provider: nextProvider,
        scanMode: nextScanMode,
        scanLevel: nextScanLevel,
      })

      setScanDirectories((prev) => [
        {
          id: created.id,
          path: created.directory,
          sourceName: created.provider,
          progress: created.progress ?? 0,
          gameCount: created.gameCount ?? 0,
          scanMode: created.scanMode ?? 0,
          scanLevel: created.scanLevel ?? 0,
          status: '未开始',
        },
        ...prev,
      ])
      setAddDirectoryOpen(false)
      toast.success('扫描目录已保存')
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || '保存扫描目录失败',
      )
    } finally {
      setIsSavingDirectory(false)
    }
  }

  const handleOpenEditDialog = (id: number) => {
    const target = scanDirectories.find((item) => item.id === id)
    setDirectoryPathInput(target?.path ?? '')
    setDirectoryProviderInput(target?.sourceName ?? DEFAULT_GAME_PROVIDER)
    setDirectoryScanModeInput(String(target?.scanMode ?? 0))
    setDirectoryScanLevelInput(String(target?.scanLevel ?? 0))
    setEditDirectoryId(target?.id ?? null)
  }

  const handleSaveEditDirectory = async () => {
    const nextPath = directoryPathInput.trim()
    const nextProvider = directoryProviderInput.trim() || DEFAULT_GAME_PROVIDER
    const nextScanMode = Number(directoryScanModeInput)
    const nextScanLevel = Number(directoryScanLevelInput)
    if (!nextPath) {
      toast.error('请填写扫描目录路径')
      return
    }

    if (
      !Number.isInteger(nextScanMode) ||
      (nextScanMode !== 0 && nextScanMode !== 1)
    ) {
      toast.error('请选择有效的扫描模式')
      return
    }

    if (!Number.isInteger(nextScanLevel) || nextScanLevel < 0) {
      toast.error('扫描层级需为大于等于 0 的整数')
      return
    }

    try {
      const updated = await updateScannerById(editDirectoryId as number, {
        directory: nextPath,
        provider: nextProvider,
        scanMode: nextScanMode,
        scanLevel: nextScanLevel,
      })

      setScanDirectories((prev) =>
        prev.map((item) =>
          item.id === editDirectoryId
            ? {
                ...item,
                path: updated.directory,
                sourceName: updated.provider,
                scanMode: updated.scanMode,
                scanLevel: updated.scanLevel,
              }
            : item,
        ),
      )

      setEditDirectoryId(null)
      toast.success('扫描目录已更新')
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '更新失败')
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card variant="outline" className="py-4">
        <CardContent className="px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 overflow-x-auto pb-1">
              <Badge
                variant="outline"
                className="hover:bg-accent hover:text-accent-foreground px-3 py-1 text-sm"
              >
                状态：已完成
              </Badge>
              <div className="flex w-52 shrink-0 items-center gap-2">
                <Progress value={progress} className="h-2" />
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Badge
                variant="outline"
                className="hover:bg-accent hover:text-accent-foreground px-3 py-1 text-sm"
              >
                扫描器个数：{scannerCount}
              </Badge>
              <Badge
                variant="outline"
                className="hover:bg-accent hover:text-accent-foreground px-3 py-1 text-sm"
              >
                游戏个数：{totalGameCount}
              </Badge>
              <button
                type="button"
                onClick={() => {
                  setFailedDialogOpen(true)
                  void loadScanErrors()
                }}
                className="cursor-pointer"
              >
                <Badge
                  variant="outline"
                  className="hover:bg-accent hover:text-accent-foreground px-3 py-1 text-sm"
                >
                  失败个数：{failedItems.length}
                </Badge>
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" onClick={handleScanAll}>
                扫描全部
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGlobalSettingOpen(true)}
              >
                全局设置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="outline">
        <CardHeader>
          <CardTitle>扫描目录列表</CardTitle>
          <Button
            data-slot="card-action"
            type="button"
            variant="outline"
            onClick={handleOpenAddDialog}
          >
            添加扫描目录列表
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {scanDirectories.map((item) => (
            <ScanDirectoryRow
              key={item.id}
              item={item}
              isScanning={
                isScanningAll || scanningDirectoryIds.includes(item.id)
              }
              onStart={(id) => void handleStartScan(id)}
              onEdit={handleOpenEditDialog}
              onDelete={(id) => void handleDeleteDirectory(id)}
            />
          ))}
        </CardContent>
      </Card>

      <Dialog open={failedDialogOpen} onOpenChange={setFailedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>失败列表</DialogTitle>
          </DialogHeader>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {isLoadingErrors ? (
              <div className="text-muted-foreground text-sm">加载中...</div>
            ) : failedItems.length === 0 ? (
              <div className="text-muted-foreground text-sm">暂无失败项</div>
            ) : (
              failedItems.map((item) => (
                <div
                  key={item.id}
                  className="space-y-1 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="font-medium">{item.error}</div>
                  <div className="text-muted-foreground text-xs">
                    目录：{item.directory}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFailedDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={globalSettingOpen} onOpenChange={setGlobalSettingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>全局设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={excludePathInput}
                onChange={(e) => setExcludePathInput(e.target.value)}
                placeholder="添加排除路径"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddExcludePath}
              >
                添加
              </Button>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto">
              {excludePaths.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  暂无排除路径
                </div>
              ) : (
                excludePaths.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{item}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveExcludePath(item)}
                      aria-label="删除排除路径"
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGlobalSettingOpen(false)}
            >
              取消
            </Button>
            <Button type="button" onClick={() => setGlobalSettingOpen(false)}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDirectoryOpen} onOpenChange={setAddDirectoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加扫描目录列表</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={directoryPathInput}
              onChange={(e) => setDirectoryPathInput(e.target.value)}
              placeholder="扫描目录"
            />
            <Select
              value={directoryProviderInput}
              onValueChange={setDirectoryProviderInput}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择数据源" />
              </SelectTrigger>
              <SelectContent>
                {GAME_PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={directoryScanModeInput}
              onValueChange={setDirectoryScanModeInput}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择扫描模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">层级扫描</SelectItem>
                <SelectItem value="1">可执行文件扫描</SelectItem>
              </SelectContent>
            </Select>
            {directoryScanModeInput === '0' ? (
              <Input
                type="number"
                min={0}
                step={1}
                value={directoryScanLevelInput}
                onChange={(e) => setDirectoryScanLevelInput(e.target.value)}
                placeholder="扫描层级（默认 0）"
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddDirectoryOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={isSavingDirectory}
              onClick={() => void handleAddDirectory()}
            >
              {isSavingDirectory ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDirectoryId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditDirectoryId(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改扫描目录</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={directoryPathInput}
              onChange={(e) => setDirectoryPathInput(e.target.value)}
              placeholder="扫描目录"
            />
            <Select
              value={directoryProviderInput}
              onValueChange={setDirectoryProviderInput}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择数据源" />
              </SelectTrigger>
              <SelectContent>
                {GAME_PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={directoryScanModeInput}
              onValueChange={setDirectoryScanModeInput}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择扫描模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">层级扫描</SelectItem>
                <SelectItem value="1">可执行文件扫描</SelectItem>
              </SelectContent>
            </Select>
            {directoryScanModeInput === '0' ? (
              <Input
                type="number"
                min={0}
                step={1}
                value={directoryScanLevelInput}
                onChange={(e) => setDirectoryScanLevelInput(e.target.value)}
                placeholder="扫描层级（默认 0）"
              />
            ) : null}
            {editingDirectory ? (
              <div className="text-muted-foreground text-xs">
                <span></span>
                当前完成度 {editingDirectory.progress}% · 游戏{' '}
                {editingDirectory.gameCount}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDirectoryId(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveEditDirectory()}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
