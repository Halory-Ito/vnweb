'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { MessageSquareQuoteIcon, QuoteIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getGameQuotesByGameId, type QuoteManageItem } from '@/lib/game/game-utils'

type GameQuoteProps = {
  gameId: number
}

export default function GameQuote({ gameId }: GameQuoteProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['game-quotes', gameId],
    queryFn: () => getGameQuotesByGameId(gameId),
    enabled: Boolean(gameId),
  })

  const items = data?.items ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground text-sm">加载中...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
        <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <MessageSquareQuoteIcon className="text-muted-foreground size-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">暂无台词摘录</h3>
        <p className="text-muted-foreground max-w-sm text-sm">
          在摘录管理页面可以为该游戏添加台词摘录
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <QuoteCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function QuoteCard({ item }: { item: QuoteManageItem }) {
  return (
    <Card variant="outline" className="relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {item.characterImage ? (
            <img
              src={item.characterImage}
              alt={item.characterName}
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <QuoteIcon className="text-primary size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {item.characterName && (
              <CardTitle className="text-sm font-medium">
                {item.characterName}
              </CardTitle>
            )}
            <p className="text-muted-foreground text-xs">
              {item.createdAt
                ? dayjs(item.createdAt).format('YYYY-MM-DD')
                : ''}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/90 text-sm">
          {item.content}
        </p>
        {item.context && (
          <p className="text-muted-foreground mt-2 text-xs">
            📖 {item.context}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
