'use client'

import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

import { bgAtom } from '@/atom/global'
import GameInfo from '@/components/game/game-info'
import { getGameById } from '@/lib/game-utils'

const DEFAULT_BG = '/bg.png'

export default function Page() {
  const params = useParams<{ id: string }>()
  const setBg = useSetAtom(bgAtom)

  const gameId = params.id
  const { data, isLoading, error } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => getGameById(gameId),
    enabled: Boolean(gameId),
  })

  useEffect(() => {
    setBg(DEFAULT_BG)
    return () => {
      setBg(DEFAULT_BG)
    }
  }, [gameId, setBg])

  useEffect(() => {
    if (data?.bg) {
      setBg(data.bg)
    }
  }, [data?.bg, setBg])

  if (isLoading) {
    return <div className="text-muted-foreground p-4 text-sm">加载中...</div>
  }

  if (error) {
    return <div className="text-destructive p-4 text-sm">加载游戏信息失败</div>
  }

  if (!data) {
    return (
      <div className="text-muted-foreground p-4 text-sm">未找到游戏信息</div>
    )
  }

  return (
    <div className="mx-auto max-h-[calc(100vh-70px)] w-full overflow-y-auto">
      <GameInfo game={data} />
    </div>
  )
}
