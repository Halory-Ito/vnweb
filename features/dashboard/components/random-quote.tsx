'use client'

import { TextQuoteIcon } from 'lucide-react'
import Link from 'next/link'

import SectionHeader from './section-header'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import type { QuoteManageItem } from '@/types'

type RandomQuoteProps = {
  quote: QuoteManageItem | null
  isLoading: boolean
  isError: boolean
}

export default function RandomQuote({ quote, isLoading, isError }: RandomQuoteProps) {
  if (!isLoading && !isError && !quote) {
    return null
  }

  return (
    <section className="space-y-3">
      <SectionHeader icon={TextQuoteIcon} title="随机摘录" />

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : isError ? (
        <p className="text-muted-foreground px-1 text-sm">加载摘录失败，请稍后重试。</p>
      ) : quote ? (
        <Card variant="outline" className="w-full">
          <CardContent className="space-y-2">
            <p className="text-base leading-7">{quote.content}</p>
            {quote.context ? (
              <p className="text-muted-foreground line-clamp-3 text-sm">📖 {quote.context}</p>
            ) : null}
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <Link
                href={`/game/info/${quote.gameId}/quote`}
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                {quote.gameNameCn || quote.gameName}
              </Link>
              {quote.characterName ? <span>· {quote.characterName}</span> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
