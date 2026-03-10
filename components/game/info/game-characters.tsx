'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

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
import {
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
  const [bindDialogOpen, setBindDialogOpen] = useState(false)
  const [bindPromptDismissed, setBindPromptDismissed] = useState(false)
  const [vndbIdInput, setVndbIdInput] = useState('')
  const [isBinding, setIsBinding] = useState(false)

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

  const hasVndbBinding = parsedSourceIds.some(
    (item) => item.provider.trim().toLowerCase() === 'vndb',
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

  useEffect(() => {
    if (vnId) {
      setBindPromptDismissed(false)
      return
    }

    if (!isLoading && !isFetching && !hasVndbBinding && !bindPromptDismissed) {
      setBindDialogOpen(true)
    }
  }, [bindPromptDismissed, hasVndbBinding, isFetching, isLoading, vnId])

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">加载中...</div>
  }

  const items = data?.items ?? []

  const handleConfirmBindVndbId = async () => {
    const rawInput = vndbIdInput.trim()
    if (!rawInput) {
      toast.error('请输入 VNDB 游戏 ID')
      return
    }

    const normalizedId = /^v\d+$/i.test(rawInput)
      ? `v${rawInput.slice(1)}`
      : /^\d+$/.test(rawInput)
        ? `v${rawInput}`
        : ''

    if (!normalizedId) {
      toast.error('VNDB 游戏 ID 格式错误，应为 v12345 或 12345')
      return
    }

    const nextSourceIds = [
      ...parsedSourceIds.filter(
        (item) => item.provider.trim().toLowerCase() !== 'vndb',
      ),
      { provider: 'vndb', externalId: normalizedId },
    ]

    const sourcePayload = nextSourceIds
      .map((item) => `${item.provider}:${item.externalId}`)
      .join(';')

    setIsBinding(true)
    try {
      await updateGameInfoById(gameId, {
        externalSourceIds: sourcePayload,
      })

      await syncVndbCharactersByGameId(gameId)

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
      setBindDialogOpen(false)
      setBindPromptDismissed(false)
      toast.success('VNDB 绑定成功，已同步人物信息')
    } catch (bindError) {
      const err = bindError as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '绑定 VNDB 失败')
    } finally {
      setIsBinding(false)
    }
  }

  if (!vnId) {
    return (
      <>
        <div className="space-y-3 rounded-md border p-4 text-center">
          <div className="text-muted-foreground text-sm">
            当前游戏未绑定 VNDB 游戏 ID
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBindPromptDismissed(false)
              setBindDialogOpen(true)
            }}
          >
            立即绑定
          </Button>
        </div>
        <Dialog
          open={bindDialogOpen}
          onOpenChange={(open) => {
            setBindDialogOpen(open)
            if (!open && !isBinding) {
              setBindPromptDismissed(true)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>绑定 VNDB 游戏 ID</DialogTitle>
              <DialogDescription>
                当前游戏尚未绑定 VNDB，是否现在绑定并同步相关人物？
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="text-sm">VNDB 游戏 ID</div>
              <Input
                value={vndbIdInput}
                onChange={(event) => setVndbIdInput(event.target.value)}
                placeholder="例如：v17 或 17"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isBinding}
                onClick={() => {
                  setBindDialogOpen(false)
                  setBindPromptDismissed(true)
                }}
              >
                取消
              </Button>
              <Button
                type="button"
                disabled={isBinding}
                onClick={() => void handleConfirmBindVndbId()}
              >
                {isBinding ? '绑定中...' : '确定'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (!items.length) {
    return (
      <div className="text-muted-foreground rounded-md border p-4 text-center text-sm">
        未获取到相关人物
      </div>
    )
  }

  return (
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
  )
}
