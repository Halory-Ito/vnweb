'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

import {
  getVndbCharactersByGameId,
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['game-characters', gameId],
    queryFn: () => getVndbCharactersByGameId(gameId),
    enabled: Boolean(gameId),
  })

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

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">加载中...</div>
  }

  const vnId = data?.vnId || ''
  const items = data?.items ?? []

  if (!vnId) {
    return (
      <div className="text-muted-foreground rounded-md border p-4 text-center text-sm">
        当前游戏未绑定 VNDB 游戏 ID
      </div>
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
