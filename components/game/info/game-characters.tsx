'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Settings, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import {
  type CharacterSyncSource,
  clearVndbCharactersByGameId,
  getGameById,
  getVndbCharactersByGameId,
  localizeCharacterImages,
  syncVndbCharactersByGameId,
  updateGameInfoById,
  type VndbCharacterListItem,
} from '@/lib/game/game-utils'
import { getEnabledCharacterProviders } from '@/lib/plugins'

type GameCharactersProps = {
  gameId: number
}

const CharacterCard = ({ item, onClick }: { item: VndbCharacterListItem; onClick: () => void }) => {
  const displayName = item.name || item.original || item.id

  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:border-primary relative aspect-9/16 w-full overflow-hidden rounded-md border text-left transition-colors"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={displayName}
          className="h-full w-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div className="text-muted-foreground flex h-full items-center justify-center bg-black/5 text-sm">
          暂无图片
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/40 to-transparent p-2">
        <div className="truncate text-sm font-medium text-white">{displayName}</div>
        {item.original && item.original !== item.name ? (
          <div className="truncate text-xs text-white/85">{item.original}</div>
        ) : null}
      </div>
    </button>
  )
}

export default function GameCharacters({ gameId }: GameCharactersProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [_syncSource, setSyncSource] = useState<CharacterSyncSource>('bangumi')
  const [selectedSource, setSelectedSource] = useState('')
  const [gameIdInput, setGameIdInput] = useState('')
  const [saveImagesToLocal, setSaveImagesToLocal] = useState(true)

  const characterProviders = useMemo(() => getEnabledCharacterProviders(), [])

  const { data: gameDetail } = useQuery({
    queryKey: ['game', String(gameId)],
    queryFn: () => getGameById(String(gameId)),
    enabled: Boolean(gameId),
  })

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch: refetchCharacters,
  } = useQuery({
    queryKey: ['game-characters', gameId],
    queryFn: () => getVndbCharactersByGameId(gameId),
    enabled: Boolean(gameId),
  })

  const externalSourceIds = gameDetail?.externalSourceIds || ''

  const parsedSourceIds = useMemo(
    () =>
      externalSourceIds
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const divider = item.indexOf(':')
          if (divider <= 0 || divider >= item.length - 1) {
            return null
          }
          return {
            provider: item.slice(0, divider).trim(),
            externalId: item.slice(divider + 1).trim(),
          }
        })
        .filter((item): item is { provider: string; externalId: string } => item !== null),
    [externalSourceIds],
  )

  useEffect(() => {
    if (!error) {
      return
    }

    const err = error as {
      response?: { data?: { error?: string } }
      message?: string
    }

    toast.error(err.response?.data?.error || err.message || '加载人物信息失败')
  }, [error])

  const vnId = data?.vnId || ''
  const bgmSubjectId = data?.bgmSubjectId || ''

  // 根据 sourceId 获取已绑定的游戏外部 ID
  const getBoundIdForSource = (sourceId: string) => {
    // 优先从 GET 接口返回的数据中取
    if (sourceId === 'vndb' && vnId) return vnId
    if (sourceId === 'bangumi' && bgmSubjectId) return bgmSubjectId
    // 其次从 externalSourceIds 解析
    return (
      parsedSourceIds.find((item) => item.provider.toLowerCase() === sourceId)?.externalId || ''
    )
  }

  const openSettingsDialog = () => {
    const source = characterProviders.length > 0 ? characterProviders[0].sourceId : ''
    setSelectedSource(source)
    setGameIdInput(getBoundIdForSource(source))
    setSaveImagesToLocal(true)
    setSettingsDialogOpen(true)
  }

  const refreshCharacters = async () => {
    await refetchCharacters()
    toast.success('角色列表已刷新')

    // 检查并本地化远程图片
    try {
      const result = await localizeCharacterImages(gameId)
      if (result.total > 0 && result.localized > 0) {
        toast.info(`正在下载 ${result.localized} 张角色图片到本地...`)
        await refetchCharacters()
        toast.success(`已完成 ${result.localized} 张图片的本地化`)
      }
    } catch {
      toast.error('图片本地化失败')
    }
  }

  const clearCharacters = async () => {
    setIsClearing(true)
    try {
      await clearVndbCharactersByGameId(gameId)
      await queryClient.invalidateQueries({
        queryKey: ['game-characters', gameId],
      })
      await refetchCharacters()
      toast.success('角色信息已清空')
    } catch (clearError) {
      const err = clearError as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '清空角色信息失败')
    } finally {
      setIsClearing(false)
      setClearDialogOpen(false)
    }
  }

  const saveSettingsAndSync = async () => {
    const provider = characterProviders.find((p) => p.sourceId === selectedSource)
    if (!provider) {
      toast.error('请先选择角色数据来源')
      return
    }

    const raw = gameIdInput.trim()
    if (!raw) {
      toast.error(`请输入 ${provider.name} 游戏 ID`)
      return
    }

    const normalized = provider.normalizeExternalId(raw)
    if (!normalized) {
      toast.error(`${provider.name} 游戏 ID 格式错误：${raw}`)
      return
    }

    // 构建 externalSourceIds：保留非角色数据源的绑定，更新当前选中的角色数据源
    const characterSourceIds = new Set(characterProviders.map((p) => p.sourceId))
    const nextSourceIds = [
      ...parsedSourceIds.filter((item) => !characterSourceIds.has(item.provider.toLowerCase())),
      { provider: provider.sourceId, externalId: normalized },
    ]

    const sourcePayload = nextSourceIds
      .map((item) => `${item.provider}:${item.externalId}`)
      .join(';')

    setIsSavingSettings(true)
    setIsSyncing(true)
    try {
      await updateGameInfoById(gameId, {
        externalSourceIds: sourcePayload,
      })

      await syncVndbCharactersByGameId(gameId, {
        source: provider.sourceId as CharacterSyncSource,
        saveImagesToLocal,
      })

      setSyncSource(provider.sourceId as CharacterSyncSource)

      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
      await queryClient.invalidateQueries({
        queryKey: ['game-characters', gameId],
      })
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })

      await refetchCharacters()
      setSettingsDialogOpen(false)
      toast.success('设置已保存并完成同步')
    } catch (saveError) {
      const err = saveError as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '保存设置失败')
    } finally {
      setIsSavingSettings(false)
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">加载中...</div>
  }

  const items = data?.items ?? []

  const showEmptyState = !items.length

  return (
    <>
      <div className="space-y-3 rounded-md pb-4">
        <div className="flex items-center justify-start gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            title="设置"
            disabled={isSavingSettings || isSyncing}
            onClick={openSettingsDialog}
          >
            <Settings className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            title="重新加载"
            disabled={isFetching || isSyncing || isSavingSettings || isClearing}
            onClick={() => void refreshCharacters()}
          >
            <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            title="清空"
            disabled={isClearing || isSavingSettings || isSyncing}
            onClick={() => setClearDialogOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空角色信息</AlertDialogTitle>
            <AlertDialogDescription>
              将删除当前游戏的全部角色数据及本地角色图片，此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isClearing}
              onClick={() => void clearCharacters()}
            >
              {isClearing ? '清空中...' : '确认清空'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={settingsDialogOpen}
        onOpenChange={(open) => {
          setSettingsDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>角色同步设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm">角色数据来源</div>
              <Select
                value={selectedSource}
                onValueChange={(value) => {
                  setSelectedSource(value)
                  setGameIdInput(getBoundIdForSource(value))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择来源" />
                </SelectTrigger>
                <SelectContent>
                  {characterProviders.map((provider) => (
                    <SelectItem key={provider.sourceId} value={provider.sourceId}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-sm">游戏 ID</div>
              <Input
                value={gameIdInput}
                onChange={(event) => setGameIdInput(event.target.value)}
                placeholder={
                  characterProviders.find((p) => p.sourceId === selectedSource)?.description ||
                  '请输入游戏 ID'
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={saveImagesToLocal}
                onCheckedChange={(checked) => setSaveImagesToLocal(checked === true)}
              />
              <span>将角色图片保存到本地</span>
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSavingSettings || isSyncing}
              onClick={() => {
                setSettingsDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={isSavingSettings || isSyncing}
              onClick={() => void saveSettingsAndSync()}
            >
              {isSavingSettings || isSyncing ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showEmptyState ? (
        <div className="text-muted-foreground rounded-md border p-4 text-center text-sm">
          未获取到相关人物
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {items.map((item) => (
            <CharacterCard
              key={item.id}
              item={item}
              onClick={() => {
                router.push(`/game/character/${encodeURIComponent(item.id)}?gameId=${gameId}`)
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
