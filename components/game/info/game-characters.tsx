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
  syncVndbCharactersByGameId,
  updateGameInfoById,
  type VndbCharacterListItem,
} from '@/lib/game-utils'

type GameCharactersProps = {
  gameId: number
}

const CharacterCard = ({
  item,
  onClick,
}: {
  item: VndbCharacterListItem
  onClick: () => void
}) => {
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
        <div className="truncate text-sm font-medium text-white">
          {displayName}
        </div>
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
  const [syncSource, setSyncSource] = useState<CharacterSyncSource>('bangumi')
  const [settingsForm, setSettingsForm] = useState({
    vndbId: '',
    bangumiId: '',
    strategy: 'bangumi' as 'bangumi' | 'vndb',
    saveImagesToLocal: true,
  })

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
        .filter(
          (item): item is { provider: string; externalId: string } =>
            item !== null,
        ),
    [externalSourceIds],
  )

  const vndbBoundId =
    parsedSourceIds.find(
      (item) => item.provider.trim().toLowerCase() === 'vndb',
    )?.externalId || ''
  const bangumiBoundId =
    parsedSourceIds.find(
      (item) => item.provider.trim().toLowerCase() === 'bangumi',
    )?.externalId || ''

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

  const normalizeVndbId = (rawInput: string) => {
    if (/^v\d+$/i.test(rawInput)) {
      return `v${rawInput.slice(1)}`
    }
    if (/^\d+$/.test(rawInput)) {
      return `v${rawInput}`
    }
    return ''
  }

  const normalizeBangumiId = (rawInput: string) => {
    const subjectMatch = rawInput.match(/subject\/(\d+)/i)
    if (subjectMatch?.[1]) {
      return subjectMatch[1]
    }
    if (/^\d+$/.test(rawInput)) {
      return rawInput
    }
    return ''
  }

  const openSettingsDialog = () => {
    setSettingsForm({
      vndbId: vnId || vndbBoundId || '',
      bangumiId: bgmSubjectId || bangumiBoundId || '',
      strategy: syncSource === 'vndb' ? 'vndb' : 'bangumi',
      saveImagesToLocal: true,
    })
    setSettingsDialogOpen(true)
  }

  const refreshCharacters = async () => {
    await refetchCharacters()
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
      toast.error(
        err.response?.data?.error || err.message || '清空角色信息失败',
      )
    } finally {
      setIsClearing(false)
      setClearDialogOpen(false)
    }
  }

  const saveSettingsAndSync = async () => {
    const rawVndbId = settingsForm.vndbId.trim()
    const rawBangumiId = settingsForm.bangumiId.trim()
    const normalizedVndbId = rawVndbId ? normalizeVndbId(rawVndbId) : ''
    const normalizedBangumiId = rawBangumiId
      ? normalizeBangumiId(rawBangumiId)
      : ''

    if (rawVndbId && !normalizedVndbId) {
      toast.error('VNDB 游戏 ID 格式错误，应为 v12345 或 12345')
      return
    }

    if (rawBangumiId && !normalizedBangumiId) {
      toast.error('Bangumi 游戏 ID 格式错误，应为 12345 或 subject/12345')
      return
    }

    if (settingsForm.strategy === 'vndb' && !normalizedVndbId) {
      toast.error('当前策略需要 VNDB 游戏 ID，请先填写')
      return
    }

    if (settingsForm.strategy === 'bangumi' && !normalizedBangumiId) {
      toast.error('当前策略需要 Bangumi 游戏 ID，请先填写')
      return
    }

    const nextSourceIds = [
      ...parsedSourceIds.filter((item) => {
        const provider = item.provider.trim().toLowerCase()
        return provider !== 'vndb' && provider !== 'bangumi'
      }),
    ]

    if (normalizedVndbId) {
      nextSourceIds.push({ provider: 'vndb', externalId: normalizedVndbId })
    }

    if (normalizedBangumiId) {
      nextSourceIds.push({
        provider: 'bangumi',
        externalId: normalizedBangumiId,
      })
    }

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
        source: settingsForm.strategy,
        saveImagesToLocal: settingsForm.saveImagesToLocal,
      })

      setSyncSource(settingsForm.strategy)

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
      <div className="space-y-3 rounded-md p-4">
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
            <RefreshCw
              className={`size-4 ${isFetching ? 'animate-spin' : ''}`}
            />
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
              <div className="text-sm">VNDB 游戏 ID</div>
              <Input
                value={settingsForm.vndbId}
                onChange={(event) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    vndbId: event.target.value,
                  }))
                }
                placeholder="例如：v17 或 17"
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm">Bangumi 游戏 ID</div>
              <Input
                value={settingsForm.bangumiId}
                onChange={(event) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    bangumiId: event.target.value,
                  }))
                }
                placeholder="例如：17 或 subject/17"
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm">角色来源策略（二选一）</div>
              <Select
                value={settingsForm.strategy}
                onValueChange={(value) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    strategy: value as typeof settingsForm.strategy,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择策略" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bangumi">bangumi</SelectItem>
                  <SelectItem value="vndb">vndb</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={settingsForm.saveImagesToLocal}
                onCheckedChange={(checked) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    saveImagesToLocal: checked === true,
                  }))
                }
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
                router.push(
                  `/game/character/${encodeURIComponent(item.id)}?gameId=${gameId}`,
                )
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
