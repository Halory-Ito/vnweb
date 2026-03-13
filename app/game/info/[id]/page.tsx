'use client'

import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { AlertCircle, SearchX } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

import { bgAtom } from '@/atom/global'
import GameInfo from '@/components/game/game-info'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { updateLastGameBackground } from '@/lib/background-settings'
import { getGameById } from '@/lib/game-utils'

function GameInfoSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      <div className="w-full rounded-lg">
        <div className="flex flex-col items-center justify-center rounded-md p-4 md:flex-row md:justify-between">
          <div className="w-full max-w-xl space-y-3">
            <Skeleton className="h-14 w-40 md:h-20 md:w-56" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          <Skeleton className="h-56 w-40 shrink-0 rounded-md border" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-16" />
        </div>
        <div className="rounded-md border p-4">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

type GameInfoEmptyStateProps = {
  icon: typeof AlertCircle
  title: string
  description: string
  children?: React.ReactNode
}

function GameInfoEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: GameInfoEmptyStateProps) {
  return (
    <div className="mx-auto max-h-[calc(100vh-70px)] w-full overflow-y-auto">
      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center p-4 md:p-6">
        <div className="bg-background/80 w-full max-w-xl rounded-2xl border px-6 py-10 text-center shadow-sm backdrop-blur-sm md:px-8">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 flex size-14 items-center justify-center rounded-full border">
            <Icon className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm leading-6">
              {description}
            </p>
          </div>
          {children ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const params = useParams<{ id: string }>()
  const setBg = useSetAtom(bgAtom)

  const gameId = params.id
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

  if (isLoading) {
    return (
      <div className="mx-auto max-h-[calc(100vh-70px)] w-full overflow-y-auto">
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
    <div className="mx-auto max-h-[calc(100vh-70px)] w-full overflow-y-auto">
      <GameInfo game={data} />
    </div>
  )
}
