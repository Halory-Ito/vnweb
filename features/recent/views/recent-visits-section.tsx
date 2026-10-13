'use client'

import { AlertCircle, HistoryIcon } from 'lucide-react'
import Link from 'next/link'

import RecentVisitCard from '../components/recent-visit-card'
import RecentVisitsSkeleton from '../components/recent-visits-skeleton'
import { useRecentVisits } from '../hooks/use-recent-visits'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function RecentVisitsSection() {
  const { data, isLoading, isError, refetch, isRefetching } = useRecentVisits()

  const items = data?.items ?? []

  if (isLoading) {
    return <RecentVisitsSkeleton />
  }

  if (isError) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full items-center justify-center p-4">
        <div className="bg-background/80 w-full max-w-xl rounded-2xl border px-6 py-10 text-center shadow-sm backdrop-blur-sm">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 flex size-14 items-center justify-center rounded-full border">
            <AlertCircle className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">加载最近访问失败</h2>
            <p className="text-muted-foreground text-sm leading-6">
              当前无法读取访问记录，请稍后重试。
            </p>
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={isRefetching}
              onClick={() => void refetch()}
            >
              {isRefetching ? '重试中...' : '重新加载'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="bg-background dark:bg-input/30 dark:border-input flex items-center gap-2 rounded-xl px-3 py-2">
        <HistoryIcon size={24} />
        <div className="text-lg font-bold">最近访问</div>
        <Badge variant="outline" className="m-0">
          共 {items.length} 项
        </Badge>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full border">
            <HistoryIcon className="size-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">还没有访问记录</h2>
            <p className="text-muted-foreground text-sm">
              浏览游戏详情、攻略或 OST 后，会自动出现在这里。
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/game">前往游戏库</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(174px,1fr))] gap-2.5 sm:gap-3">
          {items.map((item) => (
            <RecentVisitCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
