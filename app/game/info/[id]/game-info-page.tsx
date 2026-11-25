'use client'

import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { AlertCircle, SearchX } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

import { getGameById } from '@/api'
import { bgAtom } from '@/atom/global'
import { Button } from '@/components/ui/button'
import GameInfoSkeleton from '@/features/game/components/info/game-info-skeleton'
import GameInfo from '@/features/game/views/game-info'
import { useRecordVisit } from '@/features/recent'
import { updateLastGameBackground } from '@/lib/settings/background-settings'

type GameInfoEmptyStateProps = {
  icon: typeof AlertCircle
  title: string
  description: string
  children?: React.ReactNode
}

function GameInfoEmptyState({ icon: Icon, title, description, children }: GameInfoEmptyStateProps) {
  return (
    <div className="mx-auto max-h-[100cqh] w-full overflow-y-auto">
      <div className="flex min-h-[100cqh] items-center justify-center p-4 md:p-6">
        <div className="bg-background/80 w-full max-w-xl rounded-2xl border px-6 py-10 text-center shadow-sm backdrop-blur-sm md:px-8">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 flex size-14 items-center justify-center rounded-full border">
            <Icon className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm leading-6">{description}</p>
          </div>
          {children ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function GameInfoPage({
  children,
  gameId,
}: {
  children: React.ReactNode
  gameId: string
}) {
  const setBg = useSetAtom(bgAtom)

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => getGameById(gameId),
    enabled: Boolean(gameId),
  })

  useEffect(() => {
    if (data?.bg) {
      setBg(data.bg)
      updateLastGameBackground(data.bg)
    }
  }, [data?.bg, setBg])

  const recordGameId = Number(gameId)
  useRecordVisit(recordGameId, 'detail', `/game/info/${recordGameId}`)

  if (isLoading) {
    return (
      <div className="mx-auto max-h-[100cqh] w-full overflow-y-auto">
        <GameInfoSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <GameInfoEmptyState
        icon={AlertCircle}
        title="加载游戏信息失败"
        description="当前无法读取这条游戏资料。你可以重新请求一次，或稍后再试。"
      >
        <Button
          type="button"
          variant="outline"
          disabled={isRefetching}
          onClick={() => void refetch()}
        >
          {isRefetching ? '重试中...' : '重新加载'}
        </Button>
        <Button asChild>
          <Link href="/game/home">返回游戏列表</Link>
        </Button>
      </GameInfoEmptyState>
    )
  }

  if (!data) {
    return (
      <GameInfoEmptyState
        icon={SearchX}
        title="未找到游戏信息"
        description="这条记录可能已经被删除，或者当前链接中的游戏 ID 无效。"
      >
        <Button asChild>
          <Link href="/game/home">返回游戏列表</Link>
        </Button>
      </GameInfoEmptyState>
    )
  }

  return (
    <div className="mx-auto max-h-[100cqh] w-full overflow-y-auto">
      <GameInfo game={data} />
      {children}
    </div>
  )
}
