'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { getGameById, getGamePvsById, syncSteamPvsByGameId } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PvPlayback } from '@/features/pv/components/pv-preview-player'

import type { GameMediaLinkItem } from '@/types'

type GamePVProps = {
  gameId: number
}

export default function GamePV({ gameId }: GamePVProps) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<GameMediaLinkItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [bindDialogOpen, setBindDialogOpen] = useState(false)
  const [steamIdInput, setSteamIdInput] = useState('')
  const [isBinding, setIsBinding] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['game-pvs', gameId],
    queryFn: () => getGamePvsById(gameId),
    enabled: Boolean(gameId),
  })

  const { data: gameDetail } = useQuery({
    queryKey: ['game', String(gameId)],
    queryFn: () => getGameById(String(gameId)),
    enabled: Boolean(gameId),
  })

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  useEffect(() => {
    setItems(data?.items ?? [])
  }, [data])

  const hasSteamBinding = useMemo(() => {
    const sourceIds = gameDetail?.externalSourceIds || ''
    if (!sourceIds) {
      return false
    }

    return sourceIds
      .split(';')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .some((item) => {
        const divider = item.indexOf(':')
        if (divider <= 0 || divider >= item.length - 1) {
          return false
        }

        const provider = item.slice(0, divider).trim().toLowerCase()
        const externalId = item.slice(divider + 1).trim()
        return provider === 'steam' && /^\d+$/.test(externalId)
      })
  }, [gameDetail?.externalSourceIds])

  useEffect(() => {
    if (!error) {
      return
    }

    const err = error as {
      response?: { data?: { error?: string } }
      message?: string
    }
    toast.error(err.response?.data?.error || err.message || '加载PV失败')
  }, [error])

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null)
      return
    }

    setSelectedId((prev) => {
      if (prev !== null && items.some((item) => item.id === prev)) {
        return prev
      }
      return items[0].id
    })
  }, [items])

  const handleConfirmBindSteamId = async () => {
    const raw = steamIdInput.trim()
    const appId = /^\d+$/.test(raw) ? Number(raw) : NaN

    if (!Number.isInteger(appId) || appId <= 0) {
      toast.error('Steam AppID 格式错误，应为纯数字')
      return
    }

    setIsBinding(true)
    try {
      const result = await syncSteamPvsByGameId(gameId, {
        steamAppId: appId,
      })

      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      await refetch()
      setBindDialogOpen(false)

      if (result.inserted > 0) {
        toast.success(`已同步 ${result.inserted} 条 Steam PV`)
      } else if (result.total > 0) {
        toast.info('Steam PV 已存在，无需重复入库')
      } else {
        toast.info('Steam 未返回可用 PV')
      }
    } catch (bindError) {
      const err = bindError as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '绑定 Steam 并同步 PV 失败')
    } finally {
      setIsBinding(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3 rounded-md border p-3">
        {/* <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => {
              void refetch({ cancelRefetch: false })
            }}
          >
            刷新
          </Button>
        </div> */}

        <div className="max-h-105 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">暂无PV</div>
              {!hasSteamBinding ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBindDialogOpen(true)
                  }}
                >
                  绑定 Steam AppID 并获取 PV
                </Button>
              ) : null}
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === item.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                }`}
              >
                <div className="truncate font-medium">{item.name}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        {selectedItem ? (
          <div className="grid aspect-video overflow-hidden rounded-md border">
            <PvPlayback key={selectedItem.id} item={selectedItem} />
          </div>
        ) : (
          <div className="text-muted-foreground flex min-h-60 items-center justify-center rounded-md border text-sm">
            请选择一个 PV 进行播放
          </div>
        )}
      </div>

      <Dialog
        open={bindDialogOpen}
        onOpenChange={(open) => {
          setBindDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>绑定 Steam AppID</DialogTitle>
            <DialogDescription>
              当前游戏暂无 PV 且未绑定 Steam，是否现在绑定并自动同步 PV？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">Steam AppID</div>
            <Input
              value={steamIdInput}
              onChange={(event) => setSteamIdInput(event.target.value)}
              placeholder="例如：412830"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isBinding}
              onClick={() => {
                setBindDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={isBinding}
              onClick={() => void handleConfirmBindSteamId()}
            >
              {isBinding ? '同步中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
