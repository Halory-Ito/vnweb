'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { TextQuoteIcon } from 'lucide-react'

import { getQuotesByCharacterId, type QuoteManageItem } from '@/lib/game/game-utils'

type CharacterQuotesProps = {
  characterId: string
}

export default function CharacterQuotes({ characterId }: CharacterQuotesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['character-quotes', characterId],
    queryFn: () => getQuotesByCharacterId(characterId),
    enabled: Boolean(characterId),
  })

  const items = data?.items ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground text-sm">加载台词中...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
        <TextQuoteIcon className="text-muted-foreground mb-2 size-8" />
        <p className="text-muted-foreground text-sm">暂无该角色的台词摘录</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <QuoteItem key={item.id} item={item} />
      ))}
    </div>
  )
}

function QuoteItem({ item }: { item: QuoteManageItem }) {
  return (
    <div className="hover:bg-muted/50 rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm">{item.content}</p>
          {item.context && <p className="text-muted-foreground mt-2 text-xs">📖 {item.context}</p>}
        </div>
        <div className="text-muted-foreground shrink-0 text-xs">
          {item.gameNameCn || item.gameName}
        </div>
      </div>
      {item.createdAt && (
        <div className="text-muted-foreground mt-2 text-xs">
          {dayjs(item.createdAt).format('YYYY-MM-DD')}
        </div>
      )}
    </div>
  )
}
